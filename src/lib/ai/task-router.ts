import { z } from "zod";
import { CATEGORIES_TAXONOMY } from "@/lib/categories";
import type { AITaskType } from "./taskTypes";

export type AIPrivacyPolicy = "metadata_only" | "redact_pii";

export interface AITaskDefinition {
  enabled: boolean;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  promptVersion: string;
  timeoutMs: number;
  providerPolicy: string[];
  privacyPolicy: AIPrivacyPolicy;
  fallback: (input: unknown) => unknown;
}

const unavailable = (taskType: AITaskType) => ({
  available: false,
  taskType,
  reason: "non_ai_fallback",
});

const classifyInputSchema = z.object({
  titleHint: z.string().optional(),
  descriptionHint: z.string().optional(),
  locale: z.string().optional(),
});

const classifyOutputSchema = z.object({
  category: z.string(),
  subcategory: z.string().nullable(),
  tags: z.array(z.string()).max(8),
  confidence: z.number().min(0).max(1),
  source: z.enum(["ai", "fallback"]),
  notes: z.string(),
});

const moderateInputSchema = z.object({ text: z.string() });
const moderateOutputSchema = z.object({
  safe: z.boolean(),
  flags: z.array(z.string()),
  message: z.string().optional(),
});

const definitions: Record<AITaskType, AITaskDefinition> = {
  classify_item: {
    enabled: true,
    inputSchema: classifyInputSchema,
    outputSchema: classifyOutputSchema,
    promptVersion: "classify-item-v1",
    timeoutMs: 12_000,
    providerPolicy: ["huggingface"],
    privacyPolicy: "redact_pii",
    fallback: fallbackClassify,
  },
  moderate_chat: {
    enabled: true,
    inputSchema: moderateInputSchema,
    outputSchema: moderateOutputSchema,
    promptVersion: "moderate-chat-v1",
    timeoutMs: 8_000,
    providerPolicy: ["huggingface"],
    privacyPolicy: "redact_pii",
    fallback: fallbackModerate,
  },
  search_by_photo: genericTask("search_by_photo", "search-photo-v1", 15_000),
  generate_item_description: genericTask("generate_item_description", "item-description-v1", 12_000),
  estimate_value: genericTask("estimate_value", "estimate-value-v1", 12_000),
  translate: genericTask("translate", "translate-v1", 12_000),
  match: genericTask("match", "match-v1", 12_000),
  summarize_chat: genericTask("summarize_chat", "summarize-chat-v1", 12_000),
  story_assist: genericTask("story_assist", "story-assist-v1", 12_000),
  blog_assist: genericTask("blog_assist", "blog-assist-v1", 12_000),
  global_first_audit: genericTask("global_first_audit", "global-first-audit-v1", 12_000),
};

function genericTask(taskType: AITaskType, promptVersion: string, timeoutMs: number): AITaskDefinition {
  return {
    enabled: true,
    inputSchema: z.record(z.unknown()),
    outputSchema: z.record(z.unknown()),
    promptVersion,
    timeoutMs,
    providerPolicy: [],
    privacyPolicy: "redact_pii",
    fallback: () => unavailable(taskType),
  };
}

function fallbackClassify(input: unknown) {
  const parsed = classifyInputSchema.catch({}).parse(input);
  const text = [parsed.titleHint, parsed.descriptionHint].filter(Boolean).join(". ");
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const subcategory = CATEGORIES_TAXONOMY.find(
    (category) => category.level === 1 && category.keywords.some((keyword) => normalized.includes(keyword)),
  );
  const topCategory = CATEGORIES_TAXONOMY.find(
    (category) => category.level === 0 && category.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return classifyOutputSchema.parse({
    category: subcategory?.name ?? topCategory?.name ?? "hobby_games",
    subcategory: subcategory?.name ?? null,
    tags: [],
    confidence: 0.45,
    source: "fallback",
    notes: "Deterministic non-AI fallback.",
  });
}

function fallbackModerate(input: unknown) {
  const text = moderateInputSchema.catch({ text: "" }).parse(input).text;
  const flags: string[] = [];
  const containsPII =
    /\b\d{10,}\b/.test(text) ||
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text) ||
    text.includes("[email]") ||
    text.includes("[phone]");

  if (containsPII) flags.push("date_personale");
  if (text.length > 500) flags.push("mesaj_prea_lung");
  if (/(.)\1{5,}/.test(text)) flags.push("spam_caractere");
  if ((text.match(/https?:\/\//g) || []).length > 2) flags.push("spam_linkuri");

  return moderateOutputSchema.parse({
    safe: flags.length === 0,
    flags,
    message: flags.length ? `Mesaj blocat: ${flags.join(", ")}` : undefined,
  });
}

export function getAITaskDefinition(taskType: AITaskType): AITaskDefinition {
  return definitions[taskType];
}

export function redactAIInput(value: unknown): unknown {
  if (typeof value === "string") {
    return value
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, "[email]")
      .replace(/\+?\d[\d\s().-]{8,}\d/g, "[phone]");
  }
  if (Array.isArray(value)) return value.map(redactAIInput);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactAIInput(item)]),
    );
  }
  return value;
}
