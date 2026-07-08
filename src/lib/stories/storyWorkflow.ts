export const STORY_STATUSES = [
  "draft",
  "pending_partner_consent",
  "pending_moderation",
  "published",
  "hidden",
  "disputed",
  "rejected",
] as const;

export type StoryStatus = (typeof STORY_STATUSES)[number];

export const STORY_VISIBILITIES = ["private", "community", "public"] as const;

export type StoryVisibility = (typeof STORY_VISIBILITIES)[number];

export interface StoryPublicationGuardInput {
  status: StoryStatus;
  visibility: StoryVisibility;
  consentAuthor: boolean;
  consentPartner: boolean;
  hasExactLocation: boolean;
  hasSensitivePersonalData: boolean;
  linkedExchangeCompleted: boolean;
}

export function canPublishStory(input: StoryPublicationGuardInput): boolean {
  if (input.status !== "pending_moderation" && input.status !== "published") return false;
  if (input.visibility !== "public" && input.visibility !== "community") return false;
  if (!input.consentAuthor || !input.consentPartner) return false;
  if (input.hasExactLocation || input.hasSensitivePersonalData) return false;
  if (!input.linkedExchangeCompleted) return false;
  return true;
}

export function isStoryStatus(value: string): value is StoryStatus {
  return (STORY_STATUSES as readonly string[]).includes(value);
}
