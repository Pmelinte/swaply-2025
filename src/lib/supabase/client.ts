// src/lib/supabase/client.ts
"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/**
 * Canonical browser-side Supabase client (singleton).
 * Use this in Client Components only.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (_client) return _client;

  const url = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  _client = createBrowserClient(url, anon);
  return _client;
}

/**
 * Backwards-compat aliases to avoid breaking older imports.
 */
export const createClient = getSupabaseBrowserClient;
export const getBrowserClient = getSupabaseBrowserClient;
export const createBrowserSupabaseClient = getSupabaseBrowserClient;
