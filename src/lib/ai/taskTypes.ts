export const AI_TASK_TYPES = [
  "classify_item",
  "search_by_photo",
  "generate_item_description",
  "estimate_value",
  "translate",
  "match",
  "moderate_chat",
  "summarize_chat",
  "story_assist",
  "blog_assist",
  "global_first_audit",
] as const;

export type AITaskType = (typeof AI_TASK_TYPES)[number];

export function isAITaskType(value: string): value is AITaskType {
  return (AI_TASK_TYPES as readonly string[]).includes(value);
}
