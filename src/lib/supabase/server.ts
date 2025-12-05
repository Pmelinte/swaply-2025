import { cookies } from "next/headers";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
// Dacă vei avea tipuri generate din schema Supabase, le poți importa aici.
// import type { Database } from "@/types/supabase";

type TypedSupabaseClient = SupabaseClient; // sau SupabaseClient<Database> când ai types

/**
 * Creează un client Supabase pentru mediul server (Next.js App Router),
 * cu sesiunea citită/scrisă în cookies.
 *
 * De folosit în:
 *  - server components
 *  - server actions
 *  - route handlers (/app/api)
 */
export function createServerSupabaseClient(): TypedSupabaseClient {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env variables"
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = cookieStore.get(name)?.value;
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          } catch {
            // În server actions rulate în timpul generării statice,
            // cookies pot fi read-only; în acest caz ignorăm eroarea.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
            });
          } catch {
            // La fel ca mai sus, ignorăm cazul read-only.
          }
        },
      },
    }
  );
}
