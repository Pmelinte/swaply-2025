import { describe, expect, it } from "vitest";
import {
  STORY_BLOG_SEPARATION_RULES,
  assertStoryTableDoesNotLookLikeBlog,
  isBlogTableName,
  isStoryTableName,
} from "@/lib/stories/storyBlogSeparation";
import { STORY_PREVIEW_SEEDS } from "@/lib/stories/storySeeds";

describe("story and blog separation", () => {
  it("documents the separation rules", () => {
    expect(STORY_BLOG_SEPARATION_RULES.length).toBeGreaterThanOrEqual(5);
    expect(STORY_BLOG_SEPARATION_RULES.join(" ")).toContain("consent");
    expect(STORY_BLOG_SEPARATION_RULES.join(" ")).toContain("Blog");
  });

  it("classifies story and blog table names separately", () => {
    expect(isStoryTableName("stories")).toBe(true);
    expect(isStoryTableName("story_consents")).toBe(true);
    expect(isStoryTableName("blog_posts")).toBe(false);

    expect(isBlogTableName("blog_posts")).toBe(true);
    expect(isBlogTableName("blog_feedback")).toBe(true);
    expect(isBlogTableName("story_consents")).toBe(false);
  });

  it("keeps story table naming away from blog table naming", () => {
    expect(assertStoryTableDoesNotLookLikeBlog("stories")).toBe(true);
    expect(assertStoryTableDoesNotLookLikeBlog("story_translations")).toBe(true);
    expect(assertStoryTableDoesNotLookLikeBlog("blog_stories")).toBe(false);
  });

  it("keeps story preview seeds linked to exchange context", () => {
    for (const story of STORY_PREVIEW_SEEDS) {
      expect(story.exchangeId).toMatch(/^exchange-/);
      expect(story.consent.author).toBe(true);
      expect(story.consent.partner).toBe(true);
      expect(story.consent.moderated).toBe(true);
    }
  });
});
