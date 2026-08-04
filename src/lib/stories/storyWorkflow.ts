import type { StoryStatus, StoryVisibility } from "./storyTypes";
import { STORY_STATUSES, STORY_VISIBILITIES } from "./storyTypes";

export { STORY_STATUSES, STORY_VISIBILITIES };
export type { StoryStatus, StoryVisibility };

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
  if (input.visibility !== "public") return false;
  if (!input.consentAuthor || !input.consentPartner) return false;
  if (input.hasExactLocation || input.hasSensitivePersonalData) return false;
  if (!input.linkedExchangeCompleted) return false;
  return true;
}

export function isStoryStatus(value: string): value is StoryStatus {
  return (STORY_STATUSES as readonly string[]).includes(value);
}

export function isStoryVisibility(value: string): value is StoryVisibility {
  return (STORY_VISIBILITIES as readonly string[]).includes(value);
}

export function isParticipantOnlyStory(visibility: StoryVisibility): boolean {
  return visibility === "private" || visibility === "participants";
}
