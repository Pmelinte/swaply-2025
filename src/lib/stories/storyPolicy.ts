import type { PublicStoryPreview, SwaplyStoryDraft } from "./storyTypes";

const EXACT_LOCATION_PATTERNS = [
  /\b(strada|street|st\.?|avenue|bulevardul|bd\.?|road|rd\.?)\s+[\p{L}0-9 .'-]+\s+\d+\b/iu,
  /\b(apartment|apt\.?|bloc|scara|etaj|floor)\s*[a-z0-9-]+\b/iu,
  /\b\d{1,5}\s+[\p{L}0-9 .'-]+\s+(street|st\.?|road|rd\.?|avenue|ave\.?)\b/iu,
  /\b\d{2}\.\d{4,},\s*\d{2}\.\d{4,}\b/u,
] as const;

const CONTACT_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /\b(?:\+?\d[\s.-]?){8,}\b/u,
] as const;

export function hasStoryPublicationConsent(story: SwaplyStoryDraft) {
  return story.consent.author && story.consent.partner && story.consent.moderated;
}

export function canPublishStory(story: SwaplyStoryDraft) {
  if (story.visibility !== "public") return false;
  if (story.status !== "pending_moderation" && story.status !== "published") return false;
  if (!hasStoryPublicationConsent(story)) return false;
  if (containsUnsafePublicStoryDetails(story.title) || containsUnsafePublicStoryDetails(story.body)) return false;
  return true;
}

export function containsUnsafePublicStoryDetails(text: string) {
  return [...EXACT_LOCATION_PATTERNS, ...CONTACT_PATTERNS].some((pattern) => pattern.test(text));
}

export function buildPublicStoryPreview(story: SwaplyStoryDraft): PublicStoryPreview | null {
  if (!canPublishStory(story)) return null;

  return {
    id: story.id,
    domain: story.domain,
    title: redactUnsafePublicStoryDetails(story.title),
    summary: summarizeStory(redactUnsafePublicStoryDetails(story.body)),
    anonymous: story.anonymous,
    sourceLocale: story.sourceLocale,
    publishedAt: story.publishedAt ?? new Date(0).toISOString(),
  };
}

export function redactUnsafePublicStoryDetails(text: string) {
  return [...EXACT_LOCATION_PATTERNS, ...CONTACT_PATTERNS].reduce(
    (current, pattern) => current.replace(pattern, "[redacted]"),
    text,
  );
}

function summarizeStory(text: string) {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= 220) return normalized;
  return `${normalized.slice(0, 217).trim()}...`;
}
