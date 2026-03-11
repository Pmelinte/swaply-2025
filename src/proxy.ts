import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

// ── Routes that require authentication ──────────────────────────────
// Guest preview pages (/match, /chat, /my-objects, /change, /profile) are
// handled at the component level — they show a preview to unauthenticated
// visitors instead of redirecting to /login.
const AUTH_ROUTES = [
  "/objects/new",
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

function isProtectedRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isProtectedApiRoute(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) return false;
  return AUTH_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware when Supabase env vars are missing (build time / CI)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = createMiddlewareSupabase(request);

  // Always refresh the session — this keeps the auth token alive
  // and writes updated cookies to the response.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const needsAuth = isProtectedRoute(pathname) || isProtectedApiRoute(pathname);

  if (needsAuth && !user) {
    // API routes → 401 JSON response
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Page routes → redirect to login with return URL
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes → verify admin role
  if (isAdminRoute(pathname) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("badge")
      .eq("user_id", user.id)
      .maybeSingle();

    const badge = (profile as Record<string, unknown> | null)?.badge as string;
    const isAdmin = badge === "admin" || badge === "moderator";

    if (!isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden — admin access required" },
          { status: 403 },
        );
      }
      // Non-admin users get redirected to home
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return NextResponse.redirect(homeUrl);
    }
  }

  return response();
}

// Only run middleware on pages and API routes (skip static assets, _next, etc.)
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, manifest.json, sw.js, etc.
     * - Public assets in /images, /icons, etc.
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.svg|manifest\\.json|sw\\.js|workbox-.*\\.js|og-image\\.png|images/|icons/).*)",
  ],
};
