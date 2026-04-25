import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { createMiddlewareSupabase } from "./lib/supabase/middleware";

// ── next-intl locale middleware ─────────────────────────────────────
const intlMiddleware = createIntlMiddleware(routing);

// ── Routes that require authentication ──────────────────────────────
const AUTH_ROUTES = [
  "/profile",
  // /chat, /messages, /matching, /exchange are public — each page
  // renders a guest-friendly demo state when there is no session.
  "/desk",
  "/my-objects",
  "/objects/new",
  "/favorites",
  "/history",
  "/notifications",
  "/wanted",
  "/monetization",
  "/integrations",
  "/feedback",
  "/admin",
];

// ── API routes that require authentication ──────────────────────────
const AUTH_API_ROUTES = [
  "/api/ai",
  "/api/audit",
  "/api/email",
  "/api/escrow",
  "/api/gdpr",
  "/api/moderate",
  "/api/payments",
];

// ── API routes that are always public ───────────────────────────────
const PUBLIC_API_ROUTES = ["/api/health", "/api/translate"];

// ── Admin-only routes ───────────────────────────────────────────────
const ADMIN_ROUTES = ["/admin"];

/** Strip the locale prefix from a pathname to get the "bare" path */
function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  // segments[0] is "", segments[1] might be a locale
  if (
    segments.length > 1 &&
    (routing.locales as readonly string[]).includes(segments[1])
  ) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

function isProtectedRoute(barePath: string): boolean {
  return AUTH_ROUTES.some(
    (route) => barePath === route || barePath.startsWith(route + "/"),
  );
}

function isProtectedApiRoute(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) return false;
  return AUTH_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isAdminRoute(barePath: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => barePath === route || barePath.startsWith(route + "/"),
  );
}

/**
 * Supabase SSR stores its session in cookies named:
 *   sb-<project-ref>-auth-token         (single, ~legacy)
 *   sb-<project-ref>-auth-token.0/.1…   (chunked, current default)
 *   sb-access-token / sb-refresh-token  (older clients)
 */
function isSupabaseAuthCookie(name: string): boolean {
  if (!name.startsWith("sb-")) return false;
  return (
    name.includes("auth-token") ||
    name.includes("access-token") ||
    name.includes("refresh-token")
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => isSupabaseAuthCookie(c.name));
}

/** Set every Supabase auth cookie to "" with maxAge=0 so the browser drops it. */
function clearSessionCookies(
  response: NextResponse,
  request: NextRequest,
): void {
  for (const c of request.cookies.getAll()) {
    if (isSupabaseAuthCookie(c.name)) {
      response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
    }
  }
}

function redirectToLogin(
  request: NextRequest,
  pathname: string,
  barePath: string,
): NextResponse {
  const loginUrl = request.nextUrl.clone();
  const localePrefix = pathname.split("/")[1] || "en";
  loginUrl.pathname = `/${localePrefix}/login`;
  loginUrl.searchParams.set("returnTo", barePath);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Skip locale middleware for API and auth callback routes ────────
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    // Still run auth checks for API routes
    if (isProtectedApiRoute(pathname)) {
      return runAuthMiddleware(request, pathname);
    }
    return NextResponse.next();
  }

  // ── Run intl middleware (handles locale detection & redirect) ──────
  const intlResponse = intlMiddleware(request);

  // ── Stale-cookie sweep (runs on EVERY page route) ─────────────────
  // If the browser is carrying sb-* auth cookies but Supabase rejects
  // the session, wipe those cookies from the response so the user
  // doesn't stay locked in a bad-token state on public pages either.
  if (
    hasSessionCookie(request) &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const { supabase } = createMiddlewareSupabase(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      clearSessionCookies(intlResponse, request);
    }
  }

  // ── Auth checks on locale-prefixed page routes ────────────────────
  const barePath = stripLocale(pathname);

  // PUBLIC PAGE: never inspect cookies, never auth-redirect.
  // Locale redirects from intlMiddleware are still allowed.
  if (!isProtectedRoute(barePath)) {
    return intlResponse;
  }

  // PROTECTED PAGE — without Supabase env vars we can't validate; let through.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return intlResponse;
  }

  // Step 1 — no session cookie at all → redirect to login.
  if (!hasSessionCookie(request)) {
    return redirectToLogin(request, pathname, barePath);
  }

  // Step 2 — cookie present: try to validate it with Supabase.
  const { supabase, response: supaResponse } =
    createMiddlewareSupabase(request);
  // getUser() validates the token with Supabase Auth server AND triggers
  // the setAll() cookie callback, which writes refreshed auth cookies
  // back into the response. Without this, cookies are never persisted
  // and the session disappears on the next navigation.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Step 3 — cookie exists but is invalid/expired:
  // wipe the bad cookies from the browser and let the request continue.
  // The page itself decides what to show for an unauthenticated visitor.
  if (!user) {
    clearSessionCookies(intlResponse, request);
    return intlResponse;
  }

  // Step 4 — admin routes: verify role.
  if (isAdminRoute(barePath)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("badge")
      .eq("user_id", user.id)
      .maybeSingle();

    const badge = (profile as Record<string, unknown> | null)?.badge as string;
    const isAdmin = badge === "admin" || badge === "moderator";

    if (!isAdmin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = `/${pathname.split("/")[1] || "en"}`;
      return NextResponse.redirect(homeUrl);
    }
  }

  // Merge auth cookies into the intl response (preserve full cookie attributes)
  const authResponse = supaResponse();
  for (const cookie of authResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }

  return intlResponse;
}

/** Auth-only middleware for API routes (no locale handling) */
async function runAuthMiddleware(request: NextRequest, pathname: string) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Admin API routes
  if (isAdminRoute(pathname.replace(/^\/api/, "/admin"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("badge")
      .eq("user_id", user.id)
      .maybeSingle();

    const badge = (profile as Record<string, unknown> | null)?.badge as string;
    if (badge !== "admin" && badge !== "moderator") {
      return NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 },
      );
    }
  }

  return response();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next (static files, image optimization)
     * - Any path ending with a file extension (public assets like .svg, .png, .ico, .json, .js, .xml, .txt)
     * - Static asset directories: /images, /icons, /flags
     */
    "/((?!_next|images/|icons/|flags/)(?!.*\\.[\\w]+$).*)",
  ],
};
