import type { PublicFoundationStackTrackId } from "./publicFoundationStackTypes";
import { getPublicFoundationStackTrackIdsForPage } from "./publicFoundationStackContent";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";
import {
  PUBLIC_ROUTE_AUDIT_ENTRIES,
  toLocalizedRoute,
  type PublicRouteAuditEntry,
  type PublicRouteAuditId,
} from "@/lib/public-pages/publicRouteAudit";

export const FOUNDATION_STACK_PUBLIC_ROUTE_IDS = [
  "home",
  "objects",
  "properties",
  "services",
  "events",
  "explore",
  "matching",
  "messages",
  "exchange",
] as const satisfies readonly PublicRouteAuditId[];

export const FOUNDATION_STACK_PUBLIC_PAGES = [
  "home",
  "objects",
  "properties",
  "services",
  "events",
  "explore",
  "matching",
  "messages",
  "exchange",
] as const satisfies readonly PublicExperiencePage[];

export type FoundationStackPublicRouteId = (typeof FOUNDATION_STACK_PUBLIC_ROUTE_IDS)[number];
export type FoundationStackPublicPage = (typeof FOUNDATION_STACK_PUBLIC_PAGES)[number];

export interface FoundationStackPublicRouteEntry extends PublicRouteAuditEntry {
  id: FoundationStackPublicRouteId;
  page: FoundationStackPublicPage;
  foundationStackAudit: true;
}

export const FOUNDATION_STACK_REQUIRED_TRACKS_BY_PAGE = {
  home: ["ai_advisory", "token_rank", "language_fallback", "exchange_safety"],
  objects: ["ai_advisory", "language_fallback", "advanced_swaps", "exchange_safety", "photo_discovery"],
  properties: ["ai_advisory", "language_fallback", "advanced_swaps", "exchange_safety"],
  services: ["ai_advisory", "language_fallback", "advanced_swaps", "exchange_safety"],
  events: ["ai_advisory", "language_fallback", "advanced_swaps", "exchange_safety"],
  explore: ["ai_advisory", "language_fallback", "advanced_swaps", "photo_discovery"],
  matching: ["ai_advisory", "language_fallback", "advanced_swaps", "token_rank", "exchange_safety"],
  messages: ["ai_advisory", "language_fallback", "guided_chat", "exchange_safety"],
  exchange: ["ai_advisory", "language_fallback", "advanced_swaps", "token_rank", "exchange_safety"],
} as const satisfies Record<FoundationStackPublicPage, readonly PublicFoundationStackTrackId[]>;

const FOUNDATION_STACK_PUBLIC_ROUTE_ID_SET = new Set<string>(FOUNDATION_STACK_PUBLIC_ROUTE_IDS);
const FOUNDATION_STACK_PUBLIC_PAGE_SET = new Set<string>(FOUNDATION_STACK_PUBLIC_PAGES);

function isFoundationStackPublicPage(page: PublicExperiencePage | undefined): page is FoundationStackPublicPage {
  return Boolean(page && FOUNDATION_STACK_PUBLIC_PAGE_SET.has(page));
}

export function getFoundationStackPublicRouteEntries(): readonly FoundationStackPublicRouteEntry[] {
  return PUBLIC_ROUTE_AUDIT_ENTRIES.filter(
    (entry) => FOUNDATION_STACK_PUBLIC_ROUTE_ID_SET.has(entry.id) && isFoundationStackPublicPage(entry.page),
  ).map((entry) => ({
    ...entry,
    id: entry.id as FoundationStackPublicRouteId,
    page: entry.page as FoundationStackPublicPage,
    foundationStackAudit: true,
  }));
}

export function getFoundationStackLocalizedRoutes(locale = "en"): readonly string[] {
  return getFoundationStackPublicRouteEntries().map((entry) => toLocalizedRoute(entry.path, locale));
}

export function getRequiredFoundationStackTrackIdsForPage(
  page: PublicExperiencePage,
): readonly PublicFoundationStackTrackId[] {
  if (!isFoundationStackPublicPage(page)) return [];

  return FOUNDATION_STACK_REQUIRED_TRACKS_BY_PAGE[page];
}

export function getMissingFoundationStackRequiredTrackIdsForPage(
  page: PublicExperiencePage,
  limit = 5,
): readonly PublicFoundationStackTrackId[] {
  const visibleTrackIds = new Set(getPublicFoundationStackTrackIdsForPage(page, limit));

  return getRequiredFoundationStackTrackIdsForPage(page).filter((trackId) => !visibleTrackIds.has(trackId));
}

export function shouldRenderFoundationStackForLocalizedRoute(route: string, locale = "en"): boolean {
  return getFoundationStackLocalizedRoutes(locale).includes(route);
}
