// src/lib/supabase/server.ts
import { cookies } from "next/headers";
import { createServerClient as createSsrServerClient } from "@supabase/ssr";

/**
 * Canonical server-side Supabase client for Next.js App Router.
 * Uses cookies for session, works in Server Components / Route Handlers.
 */
export function createClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createSsrServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Server Components can't set cookies; it's fine.
          // (Route Handlers / Server Actions can.)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: "", ...options, maxAge: 0 });
        } catch {
          // same rationale as set()
        }
      },
    },
  });
}

/**
 * Backwards-compat alias.
 * Your codebase uses createServerClient() in some pages.
 * Keep it to avoid noisy refactors.
 */
export const createServerClient = createClient;
