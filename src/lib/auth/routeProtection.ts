const PRIVATE_PAGE_ROUTES = [
  "/profile",
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
] as const;

const PRIVATE_API_ROUTES = [
  "/api/ai",
  "/api/audit",
  "/api/email",
  "/api/escrow",
  "/api/gdpr",
  "/api/moderate",
  "/api/payments",
  "/api/admin",
  "/api/verify",
  "/api/embeddings",
  "/api/analyze-image",
  "/api/onboarding",
] as const;

const PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/translate",
  "/api/payments/webhook",
  "/api/payments/paypal/webhook",
] as const;

export function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isPrivatePageRoute(pathname: string): boolean {
  return PRIVATE_PAGE_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isPrivateApiRoute(pathname: string): boolean {
  if (PUBLIC_API_ROUTES.some((route) => matchesRoute(pathname, route))) {
    return false;
  }

  return PRIVATE_API_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isAdminPageRoute(pathname: string): boolean {
  return matchesRoute(pathname, "/admin");
}

export function buildLoginReturnTo(pathname: string, search = ""): string {
  const safePath = pathname.startsWith("/") && !pathname.startsWith("//")
    ? pathname
    : "/profile";
  const safeSearch = search.startsWith("?") ? search : "";
  return `${safePath}${safeSearch}`;
}

export function shouldRedirectPrivatePage(params: {
  isPrivate: boolean;
  hasSessionCookie: boolean;
  hasValidUser: boolean;
}): boolean {
  if (!params.isPrivate) return false;
  if (!params.hasSessionCookie) return true;
  return !params.hasValidUser;
}
