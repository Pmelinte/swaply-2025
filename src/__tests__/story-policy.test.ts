import { describe, expect, it } from "vitest";
import {
  buildPublicStoryPreview,
  canPublishStory,
  containsUnsafePublicStoryDetails,
  hasStoryPublicationConsent,
  redactUnsafePublicStoryDetails,
} from "@/lib/stories/storyPolicy";
import type { SwaplyStoryDraft } from "@/lib/stories/storyTypes";

const baseStory: SwaplyStoryDraft = {
  id: "story-one",
  exchangeId: "exchange-one",
  authorId: "author-one",
  partnerId: "partner-one",
  domain: "objects",
  title: "A repaired radio found a new home",
  body: "The owner swapped a repaired radio with someone who wanted to use it in a small community workshop.",
  media: [],
  visibility: "public",
  anonymous: true,
  sourceLocale: "en",
  status: "pending_moderation",
  consent: {
    author: true,
    partner: true,
    moderated: true,
  },
  publishedAt: "2026-01-01T00:00:00.000Z",
};

describe("story publication policy", () => {
  it("allows publication only when author, partner and moderation consent exist", () => {
    expect(hasStoryPublicationConsent(baseStory)).toBe(true);
    expect(canPublishStory(baseStory)).toBe(true);

    expect(
      canPublishStory({
        ...baseStory,
        consent: { ...baseStory.consent, partner: false },
      }),
    ).toBe(false);

    expect(
      canPublishStory({
        ...baseStory,
        consent: { ...baseStory.consent, moderated: false },
      }),
    ).toBe(false);
  });

  it("blocks participant-only, draft, rejected and disputed stories from public previews", () => {
    expect(canPublishStory({ ...baseStory, visibility: "participants" })).toBe(false);
    expect(canPublishStory({ ...baseStory, status: "draft" })).toBe(false);
    expect(canPublishStory({ ...baseStory, status: "rejected" })).toBe(false);
    expect(canPublishStory({ ...baseStory, status: "disputed" })).toBe(false);
  });

  it("blocks exact addresses and direct contact details", () => {
    expect(containsUnsafePublicStoryDetails("We met at 22 Baker Street")).toBe(true);
    expect(containsUnsafePublicStoryDetails("Contact me at person@example.com")).toBe(true);
    expect(containsUnsafePublicStoryDetails("Call +40 722 111 222 for details")).toBe(true);
    expect(containsUnsafePublicStoryDetails("We met in a public place in the city center")).toBe(false);
  });

  it("redacts unsafe details if called directly", () => {
    expect(redactUnsafePublicStoryDetails("Email person@example.com after the swap")).toContain("[redacted]");
  });

  it("builds safe public preview only for publishable stories", () => {
    const preview = buildPublicStoryPreview(baseStory);

    expect(preview).toEqual({
      id: "story-one",
      domain: "objects",
      title: "A repaired radio found a new home",
      summary: "The owner swapped a repaired radio with someone who wanted to use it in a small community workshop.",
      anonymous: true,
      sourceLocale: "en",
      publishedAt: "2026-01-01T00:00:00.000Z",
    });

    expect(buildPublicStoryPreview({ ...baseStory, consent: { ...baseStory.consent, author: false } })).toBeNull();
  });
});
