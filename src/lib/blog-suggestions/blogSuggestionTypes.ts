export type BlogContentSurface = "blog" | "stories";

export type BlogSuggestionStatus =
  | "draft"
  | "submitted"
  | "needs_moderation"
  | "accepted_for_editorial_review"
  | "rejected"
  | "converted_to_story_prompt";

export type BlogFeedbackSignal = "helpful" | "unclear" | "outdated" | "missing_example" | "unsafe_or_sensitive";

export type BlogSuggestionTopic =
  | "how_swaply_works"
  | "safety"
  | "logistics"
  | "pricing_and_value"
  | "ai_matching"
  | "stories"
  | "properties"
  | "services"
  | "events"
  | "other";

export interface BlogArticleFeedback {
  articleSlug: string;
  userId?: string | null;
  signal: BlogFeedbackSignal;
  locale: string;
  createdAtIso?: string | null;
}

export interface BlogTopicSuggestion {
  id: string;
  userId?: string | null;
  topic: BlogSuggestionTopic;
  title: string;
  reason: string;
  locale: string;
  status: BlogSuggestionStatus;
  targetSurface: BlogContentSurface;
}

export interface BlogSuggestionModerationResult {
  suggestionId: string;
  safeForEditorialReview: boolean;
  status: BlogSuggestionStatus;
  reasons: string[];
  requiresHumanModerator: true;
}

export interface BlogFeedbackSummary {
  articleSlug: string;
  helpfulCount: number;
  unclearCount: number;
  outdatedCount: number;
  missingExampleCount: number;
  unsafeOrSensitiveCount: number;
  needsEditorialReview: boolean;
}

export const BLOG_FEEDBACK_SIGNALS: readonly BlogFeedbackSignal[] = [
  "helpful",
  "unclear",
  "outdated",
  "missing_example",
  "unsafe_or_sensitive",
] as const;

export const BLOG_SUGGESTION_TOPICS: readonly BlogSuggestionTopic[] = [
  "how_swaply_works",
  "safety",
  "logistics",
  "pricing_and_value",
  "ai_matching",
  "stories",
  "properties",
  "services",
  "events",
  "other",
] as const;
