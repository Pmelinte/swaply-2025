export type StoryDomain = "objects" | "properties" | "services" | "events";

export type StoryStatus =
  | "draft"
  | "pending_consent"
  | "pending_moderation"
  | "published"
  | "hidden"
  | "disputed"
  | "rejected";

export type StoryVisibility = "private" | "participants" | "public";

export interface StoryMediaReference {
  url?: string;
  cloudinaryPublicId?: string;
  alt?: string;
}

export interface StoryConsentState {
  author: boolean;
  partner: boolean;
  moderated: boolean;
}

export interface SwaplyStoryDraft {
  id: string;
  exchangeId: string;
  authorId: string;
  partnerId: string;
  domain: StoryDomain;
  title: string;
  body: string;
  media: StoryMediaReference[];
  visibility: StoryVisibility;
  anonymous: boolean;
  sourceLocale: string;
  status: StoryStatus;
  consent: StoryConsentState;
  publishedAt: string | null;
}

export interface PublicStoryPreview {
  id: string;
  domain: StoryDomain;
  title: string;
  summary: string;
  anonymous: boolean;
  sourceLocale: string;
  publishedAt: string;
}

export const STORY_STATUSES: readonly StoryStatus[] = [
  "draft",
  "pending_consent",
  "pending_moderation",
  "published",
  "hidden",
  "disputed",
  "rejected",
] as const;

export const STORY_VISIBILITIES: readonly StoryVisibility[] = [
  "private",
  "participants",
  "public",
] as const;

export const STORY_DOMAINS: readonly StoryDomain[] = [
  "objects",
  "properties",
  "services",
  "events",
] as const;
