import { describe, expect, it } from "vitest";
import {
  canConvertSuggestionToStoryPrompt,
  canPublishFreeTextBlogComment,
  isStructuredFeedbackSignal,
  moderateBlogSuggestion,
  shouldKeepBlogAndStoriesSeparate,
  summarizeBlogFeedback,
} from "@/lib/blog-suggestions/blogSuggestionPolicy";
import { BLOG_ARTICLE_FEEDBACK_EXAMPLES, BLOG_TOPIC_SUGGESTION_EXAMPLES } from "@/lib/blog-suggestions/blogSuggestionSeeds";
import { BLOG_FEEDBACK_SIGNALS, BLOG_SUGGESTION_TOPICS } from "@/lib/blog-suggestions/blogSuggestionTypes";

describe("blog suggestions policy", () => {
  it("defines structured feedback signals and suggestion topics", () => {
    expect(BLOG_FEEDBACK_SIGNALS).toContain("helpful");
    expect(BLOG_FEEDBACK_SIGNALS).toContain("unsafe_or_sensitive");
    expect(BLOG_SUGGESTION_TOPICS).toContain("ai_matching");
    expect(BLOG_SUGGESTION_TOPICS).toContain("stories");
  });

  it("does not allow public free-text blog comments", () => {
    expect(canPublishFreeTextBlogComment()).toBe(false);
  });

  it("accepts only structured feedback signals", () => {
    expect(isStructuredFeedbackSignal("helpful")).toBe(true);
    expect(isStructuredFeedbackSignal("random_comment")).toBe(false);
  });

  it("summarizes article feedback and flags editorial review", () => {
    const summary = summarizeBlogFeedback("how-swaply-works", BLOG_ARTICLE_FEEDBACK_EXAMPLES);

    expect(summary.helpfulCount).toBe(1);
    expect(summary.missingExampleCount).toBe(1);
    expect(summary.needsEditorialReview).toBe(false);

    const outdated = summarizeBlogFeedback("safe-courier-exchange", BLOG_ARTICLE_FEEDBACK_EXAMPLES);
    expect(outdated.outdatedCount).toBe(1);
    expect(outdated.needsEditorialReview).toBe(true);
  });

  it("moderates suggestions before editorial review", () => {
    const result = moderateBlogSuggestion(BLOG_TOPIC_SUGGESTION_EXAMPLES[0]);

    expect(result.safeForEditorialReview).toBe(true);
    expect(result.status).toBe("accepted_for_editorial_review");
    expect(result.requiresHumanModerator).toBe(true);
  });

  it("keeps stories separate from editorial blog topics", () => {
    const invalid = moderateBlogSuggestion(BLOG_TOPIC_SUGGESTION_EXAMPLES[2]);

    expect(invalid.safeForEditorialReview).toBe(false);
    expect(invalid.status).toBe("needs_moderation");
    expect(invalid.reasons.join(" ")).toContain("Story surface");
  });

  it("converts only accepted story suggestions into story prompts", () => {
    expect(canConvertSuggestionToStoryPrompt(BLOG_TOPIC_SUGGESTION_EXAMPLES[1])).toBe(true);
    expect(canConvertSuggestionToStoryPrompt(BLOG_TOPIC_SUGGESTION_EXAMPLES[0])).toBe(false);
  });

  it("recognizes blog and stories as separate surfaces", () => {
    expect(shouldKeepBlogAndStoriesSeparate("blog")).toBe(true);
    expect(shouldKeepBlogAndStoriesSeparate("stories")).toBe(true);
    expect(shouldKeepBlogAndStoriesSeparate("comments")).toBe(false);
  });
});
