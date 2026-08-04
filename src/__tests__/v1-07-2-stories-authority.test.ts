import { describe, expect, it } from "vitest";
import {
  STORY_STATUSES,
  STORY_VISIBILITIES,
  canPublishStory,
  isParticipantOnlyStory,
  isStoryStatus,
  isStoryVisibility,
} from "@/lib/stories/storyWorkflow";

describe("V1-07.2 Stories authority contract", () => {
  it("uses the same Story status vocabulary as the Production database", () => {
    expect(STORY_STATUSES).toEqual([
      "draft",
      "pending_consent",
      "pending_moderation",
      "published",
      "hidden",
      "disputed",
      "rejected",
    ]);
    expect(STORY_STATUSES).not.toContain("pending_partner_consent");
    expect(isStoryStatus("pending_consent")).toBe(true);
    expect(isStoryStatus("pending_partner_consent")).toBe(false);
  });

  it("uses the same visibility vocabulary as the Production database", () => {
    expect(STORY_VISIBILITIES).toEqual(["private", "participants", "public"]);
    expect(STORY_VISIBILITIES).not.toContain("community");
    expect(isStoryVisibility("participants")).toBe(true);
    expect(isStoryVisibility("community")).toBe(false);
  });

  it("keeps private and participant Stories outside the public projection", () => {
    const base = {
      status: "pending_moderation" as const,
      consentAuthor: true,
      consentPartner: true,
      hasExactLocation: false,
      hasSensitivePersonalData: false,
      linkedExchangeCompleted: true,
    };

    expect(canPublishStory({ ...base, visibility: "private" })).toBe(false);
    expect(canPublishStory({ ...base, visibility: "participants" })).toBe(false);
    expect(canPublishStory({ ...base, visibility: "public" })).toBe(true);
    expect(isParticipantOnlyStory("private")).toBe(true);
    expect(isParticipantOnlyStory("participants")).toBe(true);
    expect(isParticipantOnlyStory("public")).toBe(false);
  });

  it("fails closed without bilateral consent, completed exchange or safe content", () => {
    const valid = {
      status: "pending_moderation" as const,
      visibility: "public" as const,
      consentAuthor: true,
      consentPartner: true,
      hasExactLocation: false,
      hasSensitivePersonalData: false,
      linkedExchangeCompleted: true,
    };

    expect(canPublishStory({ ...valid, consentAuthor: false })).toBe(false);
    expect(canPublishStory({ ...valid, consentPartner: false })).toBe(false);
    expect(canPublishStory({ ...valid, linkedExchangeCompleted: false })).toBe(false);
    expect(canPublishStory({ ...valid, hasExactLocation: true })).toBe(false);
    expect(canPublishStory({ ...valid, hasSensitivePersonalData: true })).toBe(false);
  });
});
