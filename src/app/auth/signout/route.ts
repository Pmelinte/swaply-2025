import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { normalizeAuthReturnTo } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const returnTo = normalizeAuthReturnTo(searchParams.get("returnTo"));

  const response = NextResponse.redirect(new URL(returnTo, origin));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.signOut();
  } catch {
    // The redirect still clears any cookies Supabase was able to update.
  }

  return response;
}
