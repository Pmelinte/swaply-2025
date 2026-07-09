import { describe, expect, it } from "vitest";
import {
  BLOG_EDITORIAL_STATUSES,
  canTransitionBlogStatus,
  isPublicBlogStatus,
} from "@/lib/blog/editorialWorkflow";
import { canPublishStory, STORY_STATUSES } from "@/lib/stories/storyWorkflow";

describe("blog editorial workflow", () => {
  it("uses the editorial statuses from the Swaply memory", () => {
    expect(BLOG_EDITORIAL_STATUSES).toEqual([
      "draft",
      "submitted",
      "needs_review",
      "needs_changes",
      "approved",
      "translated",
      "published",
      "archived",
      "rejected",
    ]);
  });

  it("does not publish before approval and translation", () => {
    expect(canTransitionBlogStatus("draft", "published")).toBe(false);
    expect(canTransitionBlogStatus("approved", "published")).toBe(false);
    expect(canTransitionBlogStatus("translated", "published")).toBe(true);
  });

  it("only treats published blog posts as public", () => {
    expect(isPublicBlogStatus("draft")).toBe(false);
    expect(isPublicBlogStatus("translated")).toBe(false);
    expect(isPublicBlogStatus("published")).toBe(true);
  });
});

describe("stories workflow", () => {
  it("keeps Stories statuses separate from Blog statuses", () => {
    expect(STORY_STATUSES).toEqual([
      "draft",
      "pending_partner_consent",
      "pending_moderation",
      "published",
      "hidden",
      "disputed",
      "rejected",
    ]);

    expect(STORY_STATUSES).not.toEqual(BLOG_EDITORIAL_STATUSES);
  });

  it("does not publish without both consents", () => {
    expect(
      canPublishStory({
        status: "pending_moderation",
        visibility: "public",
        consentAuthor: true,
        consentPartner: false,
        hasExactLocation: false,
        hasSensitivePersonalData: false,
        linkedExchangeCompleted: true,
      }),
    ).toBe(false);
  });

  it("does not publish exact locations or sensitive personal data", () => {
    expect(
      canPublishStory({
        status: "pending_moderation",
        visibility: "public",
        consentAuthor: true,
        consentPartner: true,
        hasExactLocation: true,
        hasSensitivePersonalData: false,
        linkedExchangeCompleted: true,
      }),
    ).toBe(false);

    expect(
      canPublishStory({
        status: "pending_moderation",
        visibility: "public",
        consentAuthor: true,
        consentPartner: true,
        hasExactLocation: false,
        hasSensitivePersonalData: true,
        linkedExchangeCompleted: true,
      }),
    ).toBe(false);
  });

  it("allows story publication only after consent, moderation and completed exchange", () => {
    expect(
      canPublishStory({
        status: "pending_moderation",
        visibility: "public",
        consentAuthor: true,
        consentPartner: true,
        hasExactLocation: false,
        hasSensitivePersonalData: false,
        linkedExchangeCompleted: true,
      }),
    ).toBe(true);
  });
});
