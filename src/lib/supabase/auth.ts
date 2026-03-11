import { getServerSupabase } from "./server";

/**
 * Check if the current request has an authenticated user.
 * Safe to call in server components — returns false when
 * Supabase is not configured (build time / CI).
 */
export async function isAuthenticated(): Promise<boolean> {
  const supabase = await getServerSupabase();
  if (!supabase) return false;
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}
