import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using service_role key.
 * Bypasses RLS — use only in trusted server contexts (webhooks, cron, admin).
 */
let _serviceClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  if (_serviceClient) return _serviceClient;

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  _serviceClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _serviceClient;
}
