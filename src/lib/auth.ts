import { getSupabaseServerClient } from './supabase/server';
import { Profile } from './types';

export async function getServerSession() {
  try {
    const supabase = getSupabaseServerClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.warn('Supabase session unavailable; returning null', error);
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getServerSession();
  if (!session) return null;
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Failed to load profile', error.message);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.warn('Supabase profile unavailable', error);
    return null;
  }
}
