import type { PublicFoundationStackTrackId } from "./publicFoundationStackTypes";

export type PublicFoundationStackCopyField = "title" | "summary" | "publicPromise" | "badge" | "ctaLabel";

export interface PublicFoundationStackTrackCopy {
  title: string;
  summary: string;
  publicPromise: string;
  badge: string;
  ctaLabel: string;
}

export interface PublicFoundationStackCopyStatus {
  locale: string;
  trackId: PublicFoundationStackTrackId;
  missingFields: readonly PublicFoundationStackCopyField[];
  usesDefaultFallback: boolean;
}

export const PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE = "en";

export const PUBLIC_FOUNDATION_STACK_COPY_FIELDS = [
  "title",
  "summary",
  "publicPromise",
  "badge",
  "ctaLabel",
] as const satisfies readonly PublicFoundationStackCopyField[];

export const PUBLIC_FOUNDATION_STACK_DEFAULT_COPY = {
  human_centered: {
    title: "Objects can carry meaning, not only price",
    summary: "Sentimental context, second-life intent and recipient messages stay optional and editable.",
    publicPromise: "Swaply can explain why a match may feel meaningful, but the owner still decides.",
    badge: "Human decision",
    ctaLabel: "Explore objects",
  },
  advanced_swaps: {
    title: "Simple, bundle and circular swaps stay consent-first",
    summary: "One-to-one, many-to-one, cross-domain and circular swap ideas can be previewed safely.",
    publicPromise: "No multi-party swap moves forward unless every participant confirms the proposal.",
    badge: "Consent gate",
    ctaLabel: "Preview matching",
  },
  photo_discovery: {
    title: "Photo discovery can help, manual creation still works",
    summary: "Search by photo and reverse discovery are treated as helpers, not blockers.",
    publicPromise: "If AI is unavailable or unsure, visitors can still understand the manual flow.",
    badge: "Safe fallback",
    ctaLabel: "Search objects",
  },
  guided_chat: {
    title: "Chat guidance stays optional and keeps originals",
    summary: "Messages can be translated, summarized and guided without replacing free conversation.",
    publicPromise: "The original message remains available, and exact location sharing is protected until agreement.",
    badge: "Original preserved",
    ctaLabel: "See messages",
  },
  exchange_safety: {
    title: "Exchange safety uses checklist and confirmations",
    summary: "Condition, logistics, packaging, delivery and feedback gates are visible before completion.",
    publicPromise: "Swaply does not auto-complete exchanges and does not publish stories from disputed exchanges.",
    badge: "No auto-complete",
    ctaLabel: "Learn exchange flow",
  },
  token_rank: {
    title: "Tokens are utility; rank is trust",
    summary: "Swapleni can reward useful activity, while trust rank is earned from safe behavior.",
    publicPromise: "Tokens cannot buy rank and cannot convert into reputation.",
    badge: "Rank not for sale",
    ctaLabel: "Read trust rules",
  },
  language_fallback: {
    title: "Global-first language fallback keeps pages open",
    summary: "Public pages should remain useful even when an exact translation is missing.",
    publicPromise: "Chat originals stay visible, and legal translations still require human review.",
    badge: "Global-first",
    ctaLabel: "Learn global flow",
  },
  blog_feedback: {
    title: "Blog feedback is structured, not a free-for-all",
    summary: "Visitors can learn from guides while suggestions stay moderated before publication.",
    publicPromise: "Blog and Stories remain separate; public free-text comments are not enabled as an unmanaged channel.",
    badge: "Editorial review",
    ctaLabel: "Open guides",
  },
  ai_advisory: {
    title: "AI explains, people decide",
    summary: "AI can classify, translate, summarize and recommend, but it remains advisory.",
    publicPromise: "Every important AI suggestion needs human confirmation and a fallback path.",
    badge: "Advisory AI",
    ctaLabel: "See AI preview",
  },
} as const satisfies Record<PublicFoundationStackTrackId, PublicFoundationStackTrackCopy>;

export const PUBLIC_FOUNDATION_STACK_COPY_BY_LOCALE = {
  en: PUBLIC_FOUNDATION_STACK_DEFAULT_COPY,
} as const satisfies Record<
  string,
  Partial<Record<PublicFoundationStackTrackId, Partial<PublicFoundationStackTrackCopy>>>
>;

function normalizeFoundationStackLocale(locale?: string | null): string {
  if (!locale) return PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE;

  return locale.toLowerCase().split("-")[0] || PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE;
}

function getLocaleCopy(locale?: string | null) {
  return PUBLIC_FOUNDATION_STACK_COPY_BY_LOCALE[normalizeFoundationStackLocale(locale)];
}

export function getPublicFoundationStackTrackCopy(
  trackId: PublicFoundationStackTrackId,
  locale?: string | null,
): PublicFoundationStackTrackCopy {
  return {
    ...PUBLIC_FOUNDATION_STACK_DEFAULT_COPY[trackId],
    ...getLocaleCopy(locale)?.[trackId],
  };
}

export function getPublicFoundationStackCopyStatus(
  trackId: PublicFoundationStackTrackId,
  locale?: string | null,
): PublicFoundationStackCopyStatus {
  const normalizedLocale = normalizeFoundationStackLocale(locale);
  const localizedCopy = getLocaleCopy(normalizedLocale)?.[trackId];
  const missingFields = PUBLIC_FOUNDATION_STACK_COPY_FIELDS.filter((field) => !localizedCopy?.[field]);

  return {
    locale: normalizedLocale,
    trackId,
    missingFields,
    usesDefaultFallback:
      normalizedLocale !== PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE && missingFields.length > 0,
  };
}

export function getPublicFoundationStackCopyStatuses(
  locale?: string | null,
): readonly PublicFoundationStackCopyStatus[] {
  return Object.keys(PUBLIC_FOUNDATION_STACK_DEFAULT_COPY).map((trackId) =>
    getPublicFoundationStackCopyStatus(trackId as PublicFoundationStackTrackId, locale),
  );
}
