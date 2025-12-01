import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to view your profile.' } },
        { status: 401 }
      );
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch profile.' } },
        { status: 500 }
      );
    }

    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: null,
          avatar_url: null,
          location: null,
          preferred_language: 'en',
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Failed to create profile.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({ profile: newProfile }, { status: 200 });
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'You must be logged in to update your profile.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, location, preferred_language, avatar_url } = body;

    const updateData: Record<string, string | null> = {};
    
    if (name !== undefined) {
      updateData.name = name || null;
    }
    if (location !== undefined) {
      updateData.location = location || null;
    }
    if (preferred_language !== undefined) {
      updateData.preferred_language = preferred_language || 'en';
    }
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url || null;
    }

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let profile;
    let error;

    if (!existingProfile) {
      const result = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          ...updateData,
        })
        .select()
        .single();
      profile = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();
      profile = result.data;
      error = result.error;
    }

    if (error) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to update profile.' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } },
      { status: 500 }
    );
  }
}
