import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Minimal server-side Supabase client for App Router.
 * Falls back to null when env vars are missing to avoid breaking builds.
 */
export function getServerSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        // Propagate cookies for RLS-aware requests when available
        Cookie: cookies().toString(),
      },
    },
  });
}
