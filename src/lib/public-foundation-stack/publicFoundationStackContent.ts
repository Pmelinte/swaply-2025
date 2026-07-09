import { PUBLIC_EXPERIENCE_PAGES } from "@/lib/public-pages/publicPageExperienceConfig";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";
import { getPublicFoundationStackTrackCopy } from "./publicFoundationStackCopy";
import type {
  PublicFoundationStackSummary,
  PublicFoundationStackTrack,
  PublicFoundationStackTrackId,
} from "./publicFoundationStackTypes";

const DOMAIN_PAGES = ["objects", "properties", "services", "events"] as const satisfies readonly PublicExperiencePage[];
const ALL_PUBLIC_PAGES = PUBLIC_EXPERIENCE_PAGES;

export const REQUIRED_PUBLIC_FOUNDATION_TRACKS = [
  "ai_advisory",
  "token_rank",
  "language_fallback",
  "exchange_safety",
] as const satisfies readonly PublicFoundationStackTrackId[];

export const PUBLIC_FOUNDATION_STACK_TRACKS = [
  {
    id: "human_centered",
    ...getPublicFoundationStackTrackCopy("human_centered"),
    ctaHref: "/objects",
    relatedAreas: ["human_centered_swapping"],
    auditCheckIds: ["audit-human-centered-advisory"],
    pages: ["home", "objects", "explore", "matching", "profile"],
    priority: 30,
    requiresLoginForRealAction: true,
  },
  {
    id: "advanced_swaps",
    ...getPublicFoundationStackTrackCopy("advanced_swaps"),
    ctaHref: "/matching",
    relatedAreas: ["advanced_swap_modes"],
    auditCheckIds: ["audit-advanced-swaps-consent"],
    pages: ["home", ...DOMAIN_PAGES, "explore", "matching", "exchange"],
    priority: 11,
    requiresLoginForRealAction: true,
  },
  {
    id: "photo_discovery",
    ...getPublicFoundationStackTrackCopy("photo_discovery"),
    ctaHref: "/objects",
    relatedAreas: ["photo_discovery", "ai_evals"],
    auditCheckIds: ["audit-photo-discovery-non-blocking", "audit-ai-evals-fallbacks"],
    pages: ["home", "objects", "explore", "matching"],
    priority: 20,
    requiresLoginForRealAction: true,
  },
  {
    id: "guided_chat",
    ...getPublicFoundationStackTrackCopy("guided_chat"),
    ctaHref: "/messages",
    relatedAreas: ["guided_chat", "language_fallback"],
    auditCheckIds: ["audit-guided-chat-original", "audit-language-global-first"],
    pages: ["home", "messages", "chat", "matching", "exchange"],
    priority: 18,
    requiresLoginForRealAction: true,
  },
  {
    id: "exchange_safety",
    ...getPublicFoundationStackTrackCopy("exchange_safety"),
    ctaHref: "/exchange",
    relatedAreas: ["exchange_lifecycle"],
    auditCheckIds: ["audit-exchange-no-auto-complete"],
    pages: ["home", ...DOMAIN_PAGES, "matching", "messages", "chat", "exchange"],
    priority: 15,
    requiresLoginForRealAction: true,
  },
  {
    id: "token_rank",
    ...getPublicFoundationStackTrackCopy("token_rank"),
    ctaHref: "/about",
    relatedAreas: ["token_rank_separation"],
    auditCheckIds: ["audit-token-rank-separated"],
    pages: ["home", "matching", "exchange", "profile"],
    priority: 12,
    requiresLoginForRealAction: false,
  },
  {
    id: "language_fallback",
    ...getPublicFoundationStackTrackCopy("language_fallback"),
    ctaHref: "/about",
    relatedAreas: ["language_fallback"],
    auditCheckIds: ["audit-language-global-first"],
    pages: ALL_PUBLIC_PAGES,
    priority: 10,
    requiresLoginForRealAction: false,
  },
  {
    id: "blog_feedback",
    ...getPublicFoundationStackTrackCopy("blog_feedback"),
    ctaHref: "/blog",
    relatedAreas: ["blog_suggestions"],
    auditCheckIds: ["audit-blog-structured-only"],
    pages: ["home", ...DOMAIN_PAGES, "explore", "profile"],
    priority: 40,
    requiresLoginForRealAction: true,
  },
  {
    id: "ai_advisory",
    ...getPublicFoundationStackTrackCopy("ai_advisory"),
    ctaHref: "/matching",
    relatedAreas: ["ai_evals", "photo_discovery", "guided_chat", "exchange_lifecycle"],
    auditCheckIds: ["audit-ai-evals-fallbacks", "audit-photo-discovery-non-blocking", "audit-guided-chat-original"],
    pages: ALL_PUBLIC_PAGES,
    priority: 5,
    requiresLoginForRealAction: true,
  },
] as const satisfies readonly PublicFoundationStackTrack[];

export function getPublicFoundationStackTracksForPage(
  page: PublicExperiencePage,
  limit = 5,
): readonly PublicFoundationStackTrack[] {
  return PUBLIC_FOUNDATION_STACK_TRACKS.filter((track) =>
    (track.pages as readonly PublicExperiencePage[]).includes(page),
  )
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}

export function getPublicFoundationStackTrackIdsForPage(
  page: PublicExperiencePage,
  limit = 5,
): readonly PublicFoundationStackTrackId[] {
  return getPublicFoundationStackTracksForPage(page, limit).map((track) => track.id);
}

export function getPublicFoundationStackSummaryForPage(
  page: PublicExperiencePage,
  limit = 5,
): PublicFoundationStackSummary {
  return {
    page,
    tracks: getPublicFoundationStackTracksForPage(page, limit),
    requiredTrackIds: REQUIRED_PUBLIC_FOUNDATION_TRACKS,
    loginRequiredOnlyForRealActions: true,
  };
}

export function getMissingRequiredPublicFoundationTrackIds(
  page: PublicExperiencePage,
  limit = 5,
): readonly PublicFoundationStackTrackId[] {
  const ids = new Set(getPublicFoundationStackTrackIdsForPage(page, limit));
  return REQUIRED_PUBLIC_FOUNDATION_TRACKS.filter((id) => !ids.has(id));
}

export function hasPublicFoundationStackTrack(
  page: PublicExperiencePage,
  trackId: PublicFoundationStackTrackId,
  limit = 5,
): boolean {
  return getPublicFoundationStackTrackIdsForPage(page, limit).includes(trackId);
}
