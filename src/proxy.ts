import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { createMiddlewareSupabase } from "./lib/supabase/middleware";

// ── next-intl locale middleware ─────────────────────────────────────
const intlMiddleware = createIntlMiddleware(routing);

// ── Routes that require authentication ──────────────────────────────
const AUTH_ROUTES = [
  "/profile",
  "/chat",
  "/match",
  "/change",
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
  "/api/translate",
];

// ── API routes that are always public ───────────────────────────────
const PUBLIC_API_ROUTES = ["/api/health"];

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

  // ── Auth checks on locale-prefixed page routes ────────────────────
  const barePath = stripLocale(pathname);

  if (!isProtectedRoute(barePath)) {
    return intlResponse;
  }

  // Need auth — check Supabase session
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return intlResponse;
  }

  const { supabase, response: supaResponse } =
    createMiddlewareSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    // Keep locale prefix in login redirect
    const localePrefix = pathname.split("/")[1] || "en";
    loginUrl.pathname = `/${localePrefix}/login`;
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes → verify admin role
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

  // Merge auth cookies into the intl response
  const authResponse = supaResponse();
  for (const cookie of authResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie.name, cookie.value);
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
