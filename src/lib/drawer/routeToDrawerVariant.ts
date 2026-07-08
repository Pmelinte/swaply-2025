import { locales } from "@/i18n/config";
import type { DrawerVariant } from "@/lib/state/drawerStore";

const ROUTE_ALIASES: Array<{
  match: (pathname: string) => boolean;
  variant: DrawerVariant;
}> = [
  {
    match: (pathname) => pathname === "/objects" || pathname.startsWith("/objects/"),
    variant: { type: "contextual", page: "objects" },
  },
  {
    match: (pathname) => pathname === "/items" || pathname.startsWith("/items/"),
    variant: { type: "contextual", page: "objects" },
  },
  {
    match: (pathname) => pathname === "/my-objects" || pathname.startsWith("/my-objects/"),
    variant: { type: "contextual", page: "objects" },
  },
  {
    match: (pathname) => pathname === "/wishlist" || pathname.startsWith("/wishlist/"),
    variant: { type: "contextual", page: "objects" },
  },
  {
    match: (pathname) => pathname === "/properties" || pathname.startsWith("/properties/"),
    variant: { type: "contextual", page: "properties" },
  },
  {
    match: (pathname) => pathname === "/services" || pathname.startsWith("/services/"),
    variant: { type: "contextual", page: "services" },
  },
  {
    match: (pathname) => pathname === "/events" || pathname.startsWith("/events/"),
    variant: { type: "contextual", page: "events" },
  },
  {
    match: (pathname) => pathname === "/matching" || pathname.startsWith("/matching/"),
    variant: { type: "matching" },
  },
  {
    match: (pathname) => pathname === "/matches" || pathname.startsWith("/matches/"),
    variant: { type: "matching" },
  },
  {
    match: (pathname) => pathname === "/messages" || pathname.startsWith("/messages/"),
    variant: { type: "contextual", page: "messages" },
  },
  {
    match: (pathname) => pathname === "/chat" || pathname.startsWith("/chat/"),
    variant: { type: "contextual", page: "chat" },
  },
  {
    match: (pathname) => pathname === "/exchange" || pathname.startsWith("/exchange/"),
    variant: { type: "contextual", page: "exchange" },
  },
  {
    match: (pathname) => pathname === "/exchanges" || pathname.startsWith("/exchanges/"),
    variant: { type: "contextual", page: "exchange" },
  },
  {
    match: (pathname) => pathname === "/change" || pathname.startsWith("/change/"),
    variant: { type: "contextual", page: "exchange" },
  },
  {
    match: (pathname) => pathname === "/explore" || pathname.startsWith("/explore/"),
    variant: { type: "explore" },
  },
  {
    match: (pathname) => pathname === "/browse" || pathname.startsWith("/browse/"),
    variant: { type: "explore" },
  },
  {
    match: (pathname) => pathname === "/blog" || pathname.startsWith("/blog/"),
    variant: { type: "contextual", page: "blog" },
  },
  {
    match: (pathname) => pathname === "/stories" || pathname.startsWith("/stories/"),
    variant: { type: "contextual", page: "stories" },
  },
];

export function stripLocaleFromPathname(pathname: string): string {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/");

  if (segments.length > 1 && (locales as readonly string[]).includes(segments[1])) {
    const rest = `/${segments.slice(2).join("/")}`;
    return rest === "/" ? "/" : rest.replace(/\/$/, "") || "/";
  }

  return normalized;
}

export function getDrawerVariantForPathname(pathname: string): DrawerVariant {
  const route = stripLocaleFromPathname(pathname);
  const alias = ROUTE_ALIASES.find((entry) => entry.match(route));
  return alias?.variant ?? { type: "home" };
}

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";

  const withoutQuery = pathname.split(/[?#]/)[0] || "/";
  const withLeadingSlash = withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
  const withoutTrailingSlash = withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/$/, "") : withLeadingSlash;

  return withoutTrailingSlash || "/";
}
