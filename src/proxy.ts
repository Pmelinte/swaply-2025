import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { createMiddlewareSupabase } from "./lib/supabase/middleware";
import {
  buildLoginReturnTo,
  isAdminPageRoute,
  isPrivateApiRoute,
  isPrivatePageRoute,
} from "./lib/auth/routeProtection";

const intlMiddleware = createIntlMiddleware(routing);

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (
    segments.length > 1 &&
    (routing.locales as readonly string[]).includes(segments[1])
  ) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

function isSupabaseAuthCookie(name: string): boolean {
  if (!name.startsWith("sb-")) return false;
  return (
    name.includes("auth-token") ||
    name.includes("access-token") ||
    name.includes("refresh-token")
  );
}

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((cookie) => isSupabaseAuthCookie(cookie.name));
}

function clearSessionCookies(
  response: NextResponse,
  request: NextRequest,
): void {
  for (const cookie of request.cookies.getAll()) {
    if (isSupabaseAuthCookie(cookie.name)) {
      response.cookies.set(cookie.name, "", { maxAge: 0, path: "/" });
    }
  }
}

function redirectToLogin(
  request: NextRequest,
  pathname: string,
  barePath: string,
): NextResponse {
  const loginUrl = request.nextUrl.clone();
  const requestedLocale = pathname.split("/")[1];
  const localePrefix = (routing.locales as readonly string[]).includes(requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  loginUrl.pathname = `/${localePrefix}/login`;
  loginUrl.search = "";
  loginUrl.searchParams.set(
    "returnTo",
    buildLoginReturnTo(barePath, request.nextUrl.search),
  );
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    if (isPrivateApiRoute(pathname)) {
      return runAuthMiddleware(request, pathname);
    }
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);
  const barePath = stripLocale(pathname);

  // Public pages must never be redirected to login. We only clear stale auth
  // cookies so a broken token cannot poison a later authenticated navigation.
  if (!isPrivatePageRoute(barePath)) {
    if (
      hasSessionCookie(request) &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const { supabase } = createMiddlewareSupabase(request);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) clearSessionCookies(intlResponse, request);
    }
    return intlResponse;
  }

  // In local/test environments without Supabase configuration, preserve the
  // existing application fallback instead of manufacturing an auth result.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return intlResponse;
  }

  if (!hasSessionCookie(request)) {
    return redirectToLogin(request, pathname, barePath);
  }

  const { supabase, response: supaResponse } = createMiddlewareSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A stale or expired cookie is not an authenticated session. Clear it and
  // redirect exactly like an anonymous request rather than rendering private UI.
  if (!user) {
    const loginResponse = redirectToLogin(request, pathname, barePath);
    clearSessionCookies(loginResponse, request);
    return loginResponse;
  }

  if (isAdminPageRoute(barePath)) {
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = (userRole as Record<string, unknown> | null)?.role as string;
    const isAdmin = role === "admin" || role === "moderator";

    if (!isAdmin) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = `/${pathname.split("/")[1] || routing.defaultLocale}`;
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  const authResponse = supaResponse();
  for (const cookie of authResponse.cookies.getAll()) {
    intlResponse.cookies.set(cookie);
  }

  return intlResponse;
}

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
    const unauthorized = NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
    clearSessionCookies(unauthorized, request);
    return unauthorized;
  }

  if (isAdminPageRoute(pathname.replace(/^\/api/, "/admin"))) {
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const role = (userRole as Record<string, unknown> | null)?.role as string;
    if (role !== "admin" && role !== "moderator") {
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
    "/((?!_next|images/|icons/|flags/)(?!.*\\.[\\w]+$).*)",
  ],
};
