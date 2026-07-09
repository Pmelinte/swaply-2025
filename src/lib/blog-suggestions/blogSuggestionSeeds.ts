import type { BlogArticleFeedback, BlogTopicSuggestion } from "./blogSuggestionTypes";

export const BLOG_ARTICLE_FEEDBACK_EXAMPLES = [
  {
    articleSlug: "how-swaply-works",
    userId: "demo-user-a",
    signal: "helpful",
    locale: "en",
    createdAtIso: null,
  },
  {
    articleSlug: "how-swaply-works",
    userId: "demo-user-b",
    signal: "missing_example",
    locale: "ro",
    createdAtIso: null,
  },
  {
    articleSlug: "safe-courier-exchange",
    userId: "demo-user-c",
    signal: "outdated",
    locale: "fr",
    createdAtIso: null,
  },
] as const satisfies readonly BlogArticleFeedback[];

export const BLOG_TOPIC_SUGGESTION_EXAMPLES = [
  {
    id: "suggestion-ai-matching-guide",
    userId: "demo-user-a",
    topic: "ai_matching",
    title: "Explain how AI matching works without making decisions for users",
    reason: "Users should understand that AI suggestions are advisory and that humans decide exchanges.",
    locale: "en",
    status: "submitted",
    targetSurface: "blog",
  },
  {
    id: "suggestion-story-after-exchange",
    userId: "demo-user-b",
    topic: "stories",
    title: "How a completed exchange becomes a story",
    reason: "Users need to know that stories require consent and moderation after feedback.",
    locale: "ro",
    status: "accepted_for_editorial_review",
    targetSurface: "stories",
  },
  {
    id: "suggestion-invalid-story-topic",
    userId: "demo-user-c",
    topic: "logistics",
    title: "Courier guide in story area",
    reason: "This should remain editorial blog content rather than a story.",
    locale: "de",
    status: "submitted",
    targetSurface: "stories",
  },
] as const satisfies readonly BlogTopicSuggestion[];
