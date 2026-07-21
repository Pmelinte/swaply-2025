import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sanitizeAuthRedirect } from "@/lib/auth/registration";

/**
 * GET /auth/callback
 *
 * Handles Supabase email confirmation redirects. The callback exchanges the
 * one-time code for a session, preserves the auth cookies on the redirect,
 * and only accepts same-origin application paths as the final destination.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = sanitizeAuthRedirect(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=confirmation`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.redirect(`${origin}/login?error=config`);
  }

  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=confirmation`);
  }

  // Send the welcome email only after the confirmation code produced a valid
  // authenticated user. Delivery remains non-critical for registration.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
      await fetch(`${appUrl}/api/email/welcome`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.user_metadata?.display_name || user.email.split("@")[0],
        }),
      });
    }
  } catch {
    // Welcome email is non-critical and must never block confirmation.
  }

  return response;
}
