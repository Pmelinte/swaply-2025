import type {
  BlogArticleFeedback,
  BlogFeedbackSignal,
  BlogFeedbackSummary,
  BlogSuggestionModerationResult,
  BlogTopicSuggestion,
} from "./blogSuggestionTypes";

const STRUCTURED_SIGNALS: readonly BlogFeedbackSignal[] = [
  "helpful",
  "unclear",
  "outdated",
  "missing_example",
  "unsafe_or_sensitive",
] as const;

export function canPublishFreeTextBlogComment() {
  return false;
}

export function isStructuredFeedbackSignal(signal: string): signal is BlogFeedbackSignal {
  return STRUCTURED_SIGNALS.includes(signal as BlogFeedbackSignal);
}

export function moderateBlogSuggestion(suggestion: BlogTopicSuggestion): BlogSuggestionModerationResult {
  const reasons: string[] = [];

  if (!suggestion.title.trim()) reasons.push("Suggestion title is required.");
  if (!suggestion.reason.trim()) reasons.push("Suggestion reason is required.");
  if (suggestion.targetSurface === "stories" && suggestion.topic !== "stories") {
    reasons.push("Story surface suggestions must be clearly linked to story content.");
  }

  return {
    suggestionId: suggestion.id,
    safeForEditorialReview: reasons.length === 0,
    status: reasons.length === 0 ? "accepted_for_editorial_review" : "needs_moderation",
    reasons: reasons.length === 0 ? ["Suggestion is structured and ready for editorial review."] : reasons,
    requiresHumanModerator: true,
  };
}

export function summarizeBlogFeedback(articleSlug: string, feedback: readonly BlogArticleFeedback[]): BlogFeedbackSummary {
  const relevant = feedback.filter((entry) => entry.articleSlug === articleSlug);
  const count = (signal: BlogFeedbackSignal) => relevant.filter((entry) => entry.signal === signal).length;
  const outdatedCount = count("outdated");
  const unclearCount = count("unclear");
  const missingExampleCount = count("missing_example");
  const unsafeOrSensitiveCount = count("unsafe_or_sensitive");

  return {
    articleSlug,
    helpfulCount: count("helpful"),
    unclearCount,
    outdatedCount,
    missingExampleCount,
    unsafeOrSensitiveCount,
    needsEditorialReview: outdatedCount > 0 || unclearCount >= 3 || missingExampleCount >= 3 || unsafeOrSensitiveCount > 0,
  };
}

export function canConvertSuggestionToStoryPrompt(suggestion: BlogTopicSuggestion) {
  return suggestion.topic === "stories" && suggestion.status === "accepted_for_editorial_review";
}

export function shouldKeepBlogAndStoriesSeparate(surface: string) {
  return surface === "blog" || surface === "stories";
}
