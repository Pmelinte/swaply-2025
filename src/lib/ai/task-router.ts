import { z } from "zod";
import { CATEGORIES_TAXONOMY } from "@/lib/categories";
import type { AITaskType } from "./taskTypes";
import {
  fallbackGenerateItemDescription,
  fallbackMatchExplanation,
  fallbackTranslateText,
} from "./fallbacks";

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

const imageReferenceSchema = z.object({
  url: z.string().url().optional(),
  cloudinaryPublicId: z.string().min(1).optional(),
  mimeType: z.string().min(1).optional(),
}).refine((image) => Boolean(image.url || image.cloudinaryPublicId), {
  message: "Image reference requires a URL or Cloudinary public ID.",
});

const classifyInputSchema = z.object({
  titleHint: z.string().max(240).optional(),
  descriptionHint: z.string().max(5_000).optional(),
  images: z.array(imageReferenceSchema).max(8).optional(),
  locale: z.string().max(20).optional(),
}).refine((input) => Boolean(input.titleHint?.trim() || input.descriptionHint?.trim() || input.images?.length), {
  message: "Classification requires text or at least one image reference.",
});

const classifyOutputSchema = z.object({
  category: z.string(),
  subcategory: z.string().nullable(),
  tags: z.array(z.string()).max(8),
  confidence: z.number().min(0).max(1),
  source: z.enum(["ai", "fallback"]),
  notes: z.string(),
});

const descriptionInputSchema = z.object({
  title: z.string().min(1).max(240),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  userNotes: z.string().max(5_000).nullable().optional(),
  locale: z.string().max(20).optional(),
});

const descriptionOutputSchema = z.object({
  title: z.string().min(1).max(240),
  description: z.string().min(1).max(10_000),
  tags: z.array(z.string()).max(8),
  source: z.enum(["ai", "fallback"]),
});

const translateInputSchema = z.object({
  text: z.string().min(1).max(5_000),
  sourceLocale: z.string().min(2).max(20).optional(),
  targetLocale: z.string().min(2).max(20).optional(),
  preserveTone: z.boolean().optional(),
});

const translateExpandedOutputSchema = z.object({
  text: z.string().optional(),
  originalText: z.string(),
  translatedText: z.string(),
  sourceLocale: z.string(),
  targetLocale: z.string(),
  source: z.enum(["ai", "fallback"]),
  warning: z.string().optional(),
});

const translateLegacyOutputSchema = z.object({
  text: z.string(),
  source: z.enum(["ai", "fallback"]).optional(),
});

const translateOutputSchema = z.union([
  translateExpandedOutputSchema,
  translateLegacyOutputSchema,
]);

const semanticMatchItemSchema = z.object({
  title: z.string().min(1).max(240),
  category: z.string().max(120).nullable().optional(),
  condition: z.string().max(120).nullable().optional(),
  description: z.string().max(5_000).nullable().optional(),
  wishlist: z.string().max(2_000).nullable().optional(),
  tags: z.array(z.string().max(80)).max(20).optional(),
  location: z.string().max(240).nullable().optional(),
  perceivedValue: z.string().max(120).nullable().optional(),
});

const matchInputSchema = z.object({
  offeredItem: semanticMatchItemSchema.optional(),
  requestedItem: semanticMatchItemSchema.optional(),
  baseScore: z.number().min(0).max(100).optional(),
  algorithmicReasons: z.array(z.string().max(500)).max(20).optional(),
  distanceKm: z.number().min(0).max(50_000).nullable().optional(),
  locale: z.string().max(20).optional(),
  offeredTitle: z.string().max(240).optional(),
  requestedTitle: z.string().max(240).optional(),
  offeredCategory: z.string().max(120).nullable().optional(),
  requestedCategory: z.string().max(120).nullable().optional(),
});

const matchOutputSchema = z.object({
  score: z.number(),
  semanticScore: z.number().min(0).max(100),
  scoreAdjustment: z.number().min(-10).max(10),
  summary: z.string().min(1).max(1_000),
  reasons: z.array(z.string().max(500)).max(10),
  risks: z.array(z.string().max(500)).max(10),
  confidence: z.enum(["high", "medium", "low"]),
  source: z.enum(["ai", "fallback"]),
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
    promptVersion: "classify-item-v2",
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
  generate_item_description: {
    enabled: true,
    inputSchema: descriptionInputSchema,
    outputSchema: descriptionOutputSchema,
    promptVersion: "item-description-v2",
    timeoutMs: 12_000,
    providerPolicy: [],
    privacyPolicy: "redact_pii",
    fallback: (input: unknown) => fallbackGenerateItemDescription(descriptionInputSchema.parse(input)),
  },
  estimate_value: genericTask("estimate_value", "estimate-value-v1", 12_000),
  translate: {
    enabled: true,
    inputSchema: translateInputSchema,
    outputSchema: translateOutputSchema,
    promptVersion: "translate-v2",
    timeoutMs: 12_000,
    providerPolicy: [],
    privacyPolicy: "redact_pii",
    fallback: (input: unknown) => {
      const parsed = translateInputSchema.parse(input);
      return fallbackTranslateText({
        text: parsed.text,
        sourceLocale: parsed.sourceLocale ?? "und",
        targetLocale: parsed.targetLocale ?? "und",
        preserveTone: parsed.preserveTone,
      });
    },
  },
  match: {
    enabled: true,
    inputSchema: matchInputSchema,
    outputSchema: matchOutputSchema,
    promptVersion: "semantic-match-v2",
    timeoutMs: 12_000,
    providerPolicy: [],
    privacyPolicy: "redact_pii",
    fallback: (input: unknown) => fallbackMatchExplanation(matchInputSchema.parse(input)),
  },
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
  const parsed = classifyInputSchema.parse(input);
  const text = [parsed.titleHint, parsed.descriptionHint].filter(Boolean).join(". ");
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const subcategory = CATEGORIES_TAXONOMY.find(
    (category) => category.level === 1 && category.keywords.some((keyword) => normalized.includes(keyword)),
  );
  const topCategory = CATEGORIES_TAXONOMY.find(
    (category) => category.level === 0 && category.keywords.some((keyword) => normalized.includes(keyword)),
  );

  const warnings = parsed.images?.length && !text
    ? "Image references were received, but no vision provider is active; manual review is required."
    : "Deterministic non-AI fallback.";

  return classifyOutputSchema.parse({
    category: subcategory?.name ?? topCategory?.name ?? "objects",
    subcategory: subcategory?.name ?? null,
    tags: fallbackTags(text),
    confidence: text ? 0.45 : 0,
    source: "fallback",
    notes: warnings,
  });
}

function fallbackTags(text: string) {
  return Array.from(new Set(
    text.toLowerCase().split(/[^a-z0-9ăâîșț]+/iu).filter((word) => word.length >= 3),
  )).slice(0, 5);
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