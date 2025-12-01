import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

function formatError(code: string, message: string, status = 500) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return formatError('UNAUTHORIZED', 'You must be logged in to view your profile.', 401);
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profile) {
      return NextResponse.json({ profile }, { status: 200 });
    }

    if (error && error.code !== 'PGRST116') {
      return formatError('INTERNAL_ERROR', 'Failed to fetch profile.');
    }

    const { data: createdProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        name: null,
        location: null,
        preferred_language: null,
        avatar_url: null,
      })
      .select()
      .single();

    if (insertError || !createdProfile) {
      return formatError('INTERNAL_ERROR', 'Failed to create profile.');
    }

    return NextResponse.json({ profile: createdProfile }, { status: 200 });
  } catch (error) {
    return formatError('INTERNAL_ERROR', 'An unexpected error occurred.');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return formatError('UNAUTHORIZED', 'You must be logged in to update your profile.', 401);
    }

    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const location = typeof body.location === 'string' ? body.location.trim() : '';
    const preferred_language = typeof body.preferred_language === 'string' ? body.preferred_language : '';
    const avatar_url = typeof body.avatar_url === 'string' ? body.avatar_url : '';

    const payload = {
      user_id: user.id,
      name: name || null,
      location: location || null,
      preferred_language: preferred_language || null,
      avatar_url: avatar_url || null,
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      return formatError('INTERNAL_ERROR', 'Failed to update profile.');
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    return formatError('INTERNAL_ERROR', 'An unexpected error occurred.');
  }
}
