import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * GET /auth/callback
 *
 * Handles the Supabase email confirmation redirect.
 * When a user clicks the confirmation link in their email,
 * Supabase redirects here with a `code` query parameter.
 * We exchange that code for a session, then redirect to the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.redirect(`${origin}/login?error=config`);
    }

    const response = NextResponse.redirect(`${origin}${next}`);

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

    if (!error) {
      // Send welcome email now that the user is confirmed
      try {
        const { data: { user } } = await supabase.auth.getUser();
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
        // Welcome email is non-critical
      }

      return response;
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}
