import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to view items.' } },
        { status: 401 }
      );
    }

    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch items.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to create items.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, image_url } = body;

    if (!title || title.length < 2) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Title must be at least 2 characters.' } },
        { status: 400 }
      );
    }

    if (!image_url) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Image URL is required.' } },
        { status: 400 }
      );
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        image_url,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to create item.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
