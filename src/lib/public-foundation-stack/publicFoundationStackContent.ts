import { PUBLIC_EXPERIENCE_PAGES } from "@/lib/public-pages/publicPageExperienceConfig";
import type { PublicExperiencePage } from "@/lib/public-pages/publicPageExperienceConfig";
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
    title: "Objects can carry meaning, not only price",
    summary: "Sentimental context, second-life intent and recipient messages stay optional and editable.",
    publicPromise: "Swaply can explain why a match may feel meaningful, but the owner still decides.",
    badge: "Human decision",
    ctaHref: "/objects",
    ctaLabel: "Explore objects",
    relatedAreas: ["human_centered_swapping"],
    auditCheckIds: ["audit-human-centered-advisory"],
    pages: ["home", "objects", "explore", "matching", "profile"],
    priority: 30,
    requiresLoginForRealAction: true,
  },
  {
    id: "advanced_swaps",
    title: "Simple, bundle and circular swaps stay consent-first",
    summary: "One-to-one, many-to-one, cross-domain and circular swap ideas can be previewed safely.",
    publicPromise: "No multi-party swap moves forward unless every participant confirms the proposal.",
    badge: "Consent gate",
    ctaHref: "/matching",
    ctaLabel: "Preview matching",
    relatedAreas: ["advanced_swap_modes"],
    auditCheckIds: ["audit-advanced-swaps-consent"],
    pages: ["home", ...DOMAIN_PAGES, "explore", "matching", "exchange"],
    priority: 11,
    requiresLoginForRealAction: true,
  },
  {
    id: "photo_discovery",
    title: "Photo discovery can help, manual creation still works",
    summary: "Search by photo and reverse discovery are treated as helpers, not blockers.",
    publicPromise: "If AI is unavailable or unsure, visitors can still understand the manual flow.",
    badge: "Safe fallback",
    ctaHref: "/objects",
    ctaLabel: "Search objects",
    relatedAreas: ["photo_discovery", "ai_evals"],
    auditCheckIds: ["audit-photo-discovery-non-blocking", "audit-ai-evals-fallbacks"],
    pages: ["home", "objects", "explore", "matching"],
    priority: 20,
    requiresLoginForRealAction: true,
  },
  {
    id: "guided_chat",
    title: "Chat guidance stays optional and keeps originals",
    summary: "Messages can be translated, summarized and guided without replacing free conversation.",
    publicPromise: "The original message remains available, and exact location sharing is protected until agreement.",
    badge: "Original preserved",
    ctaHref: "/messages",
    ctaLabel: "See messages",
    relatedAreas: ["guided_chat", "language_fallback"],
    auditCheckIds: ["audit-guided-chat-original", "audit-language-global-first"],
    pages: ["home", "messages", "chat", "matching", "exchange"],
    priority: 18,
    requiresLoginForRealAction: true,
  },
  {
    id: "exchange_safety",
    title: "Exchange safety uses checklist and confirmations",
    summary: "Condition, logistics, packaging, delivery and feedback gates are visible before completion.",
    publicPromise: "Swaply does not auto-complete exchanges and does not publish stories from disputed exchanges.",
    badge: "No auto-complete",
    ctaHref: "/exchange",
    ctaLabel: "Learn exchange flow",
    relatedAreas: ["exchange_lifecycle"],
    auditCheckIds: ["audit-exchange-no-auto-complete"],
    pages: ["home", ...DOMAIN_PAGES, "matching", "messages", "chat", "exchange"],
    priority: 15,
    requiresLoginForRealAction: true,
  },
  {
    id: "token_rank",
    title: "Tokens are utility; rank is trust",
    summary: "Swapleni can reward useful activity, while trust rank is earned from safe behavior.",
    publicPromise: "Tokens cannot buy rank and cannot convert into reputation.",
    badge: "Rank not for sale",
    ctaHref: "/about",
    ctaLabel: "Read trust rules",
    relatedAreas: ["token_rank_separation"],
    auditCheckIds: ["audit-token-rank-separated"],
    pages: ["home", "matching", "exchange", "profile"],
    priority: 12,
    requiresLoginForRealAction: false,
  },
  {
    id: "language_fallback",
    title: "Global-first language fallback keeps pages open",
    summary: "Public pages should remain useful even when an exact translation is missing.",
    publicPromise: "Chat originals stay visible, and legal translations still require human review.",
    badge: "Global-first",
    ctaHref: "/about",
    ctaLabel: "Learn global flow",
    relatedAreas: ["language_fallback"],
    auditCheckIds: ["audit-language-global-first"],
    pages: ALL_PUBLIC_PAGES,
    priority: 10,
    requiresLoginForRealAction: false,
  },
  {
    id: "blog_feedback",
    title: "Blog feedback is structured, not a free-for-all",
    summary: "Visitors can learn from guides while suggestions stay moderated before publication.",
    publicPromise: "Blog and Stories remain separate; public free-text comments are not enabled as an unmanaged channel.",
    badge: "Editorial review",
    ctaHref: "/blog",
    ctaLabel: "Open guides",
    relatedAreas: ["blog_suggestions"],
    auditCheckIds: ["audit-blog-structured-only"],
    pages: ["home", ...DOMAIN_PAGES, "explore", "profile"],
    priority: 40,
    requiresLoginForRealAction: true,
  },
  {
    id: "ai_advisory",
    title: "AI explains, people decide",
    summary: "AI can classify, translate, summarize and recommend, but it remains advisory.",
    publicPromise: "Every important AI suggestion needs human confirmation and a fallback path.",
    badge: "Advisory AI",
    ctaHref: "/matching",
    ctaLabel: "See AI preview",
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
