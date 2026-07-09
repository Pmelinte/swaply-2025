import type { PublicExperiencePage } from "./publicPageExperienceConfig";

export type PublicRouteAuditKind = "core" | "domain" | "workflow" | "content" | "legal" | "support";

export type PublicRouteSitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface PublicRouteAuditEntry {
  id: string;
  path: string;
  page?: PublicExperiencePage;
  kind: PublicRouteAuditKind;
  visualAudit: boolean;
  drawerAudit: boolean;
  mustNotBeLoginWall: boolean;
  seoAudit: boolean;
  trustAudit: boolean;
  legalAudit: boolean;
  sitemapAudit: boolean;
  sitemapPriority?: number;
  sitemapChangeFrequency?: PublicRouteSitemapChangeFrequency;
  requiresPageContext?: boolean;
}

const PUBLIC_SEO_ROUTE_DEFAULTS = {
  seoAudit: true,
  trustAudit: false,
  legalAudit: false,
  sitemapAudit: true,
  sitemapChangeFrequency: "weekly" as const,
  sitemapPriority: 0.8,
};

const PUBLIC_LEGAL_ROUTE_DEFAULTS = {
  seoAudit: true,
  trustAudit: true,
  legalAudit: true,
  sitemapAudit: true,
  sitemapChangeFrequency: "monthly" as const,
  sitemapPriority: 0.8,
};

const CONTEXT_ONLY_ROUTE_DEFAULTS = {
  seoAudit: false,
  trustAudit: false,
  legalAudit: false,
  sitemapAudit: false,
};

export const PUBLIC_ROUTE_AUDIT_ENTRIES = [
  {
    id: "home",
    path: "/",
    page: "home",
    kind: "core",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapChangeFrequency: "daily",
    sitemapPriority: 1,
  },
  {
    id: "objects",
    path: "/objects",
    page: "objects",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.95,
  },
  {
    id: "properties",
    path: "/properties",
    page: "properties",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.95,
  },
  {
    id: "services",
    path: "/services",
    page: "services",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.95,
  },
  {
    id: "events",
    path: "/events",
    page: "events",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.95,
  },
  {
    id: "explore",
    path: "/explore",
    page: "explore",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.85,
  },
  {
    id: "matching",
    path: "/matching",
    page: "matching",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.85,
  },
  {
    id: "messages",
    path: "/messages",
    page: "messages",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.75,
  },
  {
    id: "exchange",
    path: "/exchange",
    page: "exchange",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 0.85,
  },
  {
    id: "chat-context",
    path: "/chat",
    page: "chat",
    kind: "workflow",
    visualAudit: false,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    requiresPageContext: true,
    ...CONTEXT_ONLY_ROUTE_DEFAULTS,
  },
  {
    id: "profile-context",
    path: "/profile",
    page: "profile",
    kind: "workflow",
    visualAudit: false,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    requiresPageContext: true,
    ...CONTEXT_ONLY_ROUTE_DEFAULTS,
  },
  {
    id: "blog",
    path: "/blog",
    kind: "content",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    sitemapPriority: 1,
  },
  {
    id: "about",
    path: "/about",
    kind: "support",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    trustAudit: true,
    sitemapChangeFrequency: "monthly",
    sitemapPriority: 1,
  },
  {
    id: "pricing",
    path: "/pricing",
    kind: "support",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    trustAudit: true,
    sitemapChangeFrequency: "monthly",
    sitemapPriority: 1,
  },
  {
    id: "info",
    path: "/info",
    kind: "support",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    trustAudit: true,
    sitemapPriority: 1,
  },
  {
    id: "contact",
    path: "/contact",
    kind: "support",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_SEO_ROUTE_DEFAULTS,
    trustAudit: true,
    sitemapChangeFrequency: "monthly",
  },
  {
    id: "terms",
    path: "/terms",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_LEGAL_ROUTE_DEFAULTS,
  },
  {
    id: "privacy",
    path: "/privacy",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_LEGAL_ROUTE_DEFAULTS,
  },
  {
    id: "cookies",
    path: "/cookies",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_LEGAL_ROUTE_DEFAULTS,
  },
  {
    id: "safety",
    path: "/safety",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_LEGAL_ROUTE_DEFAULTS,
  },
  {
    id: "dmca",
    path: "/dmca",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_LEGAL_ROUTE_DEFAULTS,
    sitemapPriority: 0.7,
  },
  {
    id: "copyright",
    path: "/copyright",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
    ...PUBLIC_LEGAL_ROUTE_DEFAULTS,
    sitemapPriority: 0.7,
  },
] as const satisfies readonly PublicRouteAuditEntry[];

export type PublicRouteAuditId = (typeof PUBLIC_ROUTE_AUDIT_ENTRIES)[number]["id"];

export function toLocalizedRoute(path: string, locale = "en") {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export function toSitemapPath(path: string) {
  return path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
}

export function getPublicVisualAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.visualAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicDrawerAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.drawerAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicSeoAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.seoAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicTrustAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.trustAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicLegalAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.legalAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicSitemapAuditEntries() {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.sitemapAudit);
}

export function getPublicSitemapAuditRoutes(locale = "en") {
  return getPublicSitemapAuditEntries().map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicRouteAuditEntry(id: PublicRouteAuditId) {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.find((entry) => entry.id === id);
}
