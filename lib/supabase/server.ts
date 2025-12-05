import { cookies } from "next/headers";
import { type CookieOptions, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// TODO: înlocuiește cu SupabaseClient<Database> când vei genera tipurile DB.
type TypedSupabaseClient = SupabaseClient;

/**
 * Creează un client Supabase pentru mediul server (Next.js App Router),
 * folosind cookies pentru a menține sesiunea utilizatorului.
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
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          } catch {
            // În anumite contexte (ex: static generation) cookies pot fi read-only.
            // În aceste cazuri ignorăm eroarea pentru a evita crash.
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
            // La fel ca mai sus, tolerăm cookie store read-only.
          }
        },
      },
    }
  );
}

// Alias vechi folosit în codul existent (upload-image, items etc.)
export function getSupabaseServerClient() {
  return createServerSupabaseClient();
}

// Compat pentru cod mai vechi care folosea numele createClient().
export const createClient = createServerSupabaseClient;
