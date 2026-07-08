import type { PublicExperiencePage } from "./publicPageExperienceConfig";

export type PublicRouteAuditKind = "core" | "domain" | "workflow" | "content" | "legal" | "support";

export interface PublicRouteAuditEntry {
  id: string;
  path: string;
  page?: PublicExperiencePage;
  kind: PublicRouteAuditKind;
  visualAudit: boolean;
  drawerAudit: boolean;
  mustNotBeLoginWall: boolean;
  requiresPageContext?: boolean;
}

export const PUBLIC_ROUTE_AUDIT_ENTRIES = [
  {
    id: "home",
    path: "/",
    page: "home",
    kind: "core",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
  },
  {
    id: "objects",
    path: "/objects",
    page: "objects",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "properties",
    path: "/properties",
    page: "properties",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "services",
    path: "/services",
    page: "services",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "events",
    path: "/events",
    page: "events",
    kind: "domain",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "explore",
    path: "/explore",
    page: "explore",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "matching",
    path: "/matching",
    page: "matching",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "messages",
    path: "/messages",
    page: "messages",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "exchange",
    path: "/exchange",
    page: "exchange",
    kind: "workflow",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
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
  },
  {
    id: "blog",
    path: "/blog",
    kind: "content",
    visualAudit: true,
    drawerAudit: true,
    mustNotBeLoginWall: true,
  },
  {
    id: "about",
    path: "/about",
    kind: "support",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
  },
  {
    id: "contact",
    path: "/contact",
    kind: "support",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
  },
  {
    id: "terms",
    path: "/terms",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
  },
  {
    id: "privacy",
    path: "/privacy",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
  },
  {
    id: "safety",
    path: "/safety",
    kind: "legal",
    visualAudit: true,
    drawerAudit: false,
    mustNotBeLoginWall: true,
  },
] as const satisfies readonly PublicRouteAuditEntry[];

export type PublicRouteAuditId = (typeof PUBLIC_ROUTE_AUDIT_ENTRIES)[number]["id"];

export function toLocalizedRoute(path: string, locale = "en") {
  const normalizedPath = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export function getPublicVisualAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.visualAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicDrawerAuditRoutes(locale = "en") {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter((entry) => entry.drawerAudit).map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getPublicRouteAuditEntry(id: PublicRouteAuditId) {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.find((entry) => entry.id === id);
}
