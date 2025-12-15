import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to view items.' } },
        { status: 401 }
      );
    }

    const { data: item, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: { code: 'ITEM_NOT_FOUND', message: 'Item not found.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to update items.' } },
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
      .update({
        title,
        description: description || null,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !item) {
      return NextResponse.json(
        { error: { code: 'ITEM_NOT_FOUND', message: 'Item not found or you do not have permission to update it.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to delete items.' } },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'ITEM_NOT_FOUND', message: 'Item not found or you do not have permission to delete it.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Item deleted successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
