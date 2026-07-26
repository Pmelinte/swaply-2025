import { z } from "zod";
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

const definitions: Record<AITaskType, AITaskDefinition> = {
  classify_item: {
    enabled: true,
    inputSchema: z.object({ titleHint: z.string().optional(), descriptionHint: z.string().optional(), locale: z.string().optional() }),
    outputSchema: z.object({ category: z.string(), subcategory: z.string().nullable(), tags: z.array(z.string()).max(8), confidence: z.number().min(0).max(1), source: z.enum(["ai", "fallback"]), notes: z.string() }),
    promptVersion: "classify-item-v1",
    timeoutMs: 12_000,
    providerPolicy: ["huggingface"],
    privacyPolicy: "redact_pii",
    fallback: () => ({ category: "hobby_games", subcategory: null, tags: [], confidence: 0, source: "fallback", notes: "Non-AI fallback." }),
  },
  moderate_chat: {
    enabled: true,
    inputSchema: z.object({ text: z.string() }),
    outputSchema: z.object({ safe: z.boolean(), flags: z.array(z.string()), message: z.string().optional() }),
    promptVersion: "moderate-chat-v1",
    timeoutMs: 8_000,
    providerPolicy: ["huggingface"],
    privacyPolicy: "redact_pii",
    fallback: (input) => {
      const text = z.object({ text: z.string() }).catch({ text: "" }).parse(input).text;
      const flags: string[] = [];
      if (/\b\d{10,}\b/.test(text) || /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(text)) flags.push("date_personale");
      if (text.length > 500) flags.push("mesaj_prea_lung");
      if (/(.)\1{5,}/.test(text)) flags.push("spam_caractere");
      if ((text.match(/https?:\/\//g) || []).length > 2) flags.push("spam_linkuri");
      return { safe: flags.length === 0, flags, message: flags.length ? `Mesaj blocat: ${flags.join(", ")}` : undefined };
    },
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
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactAIInput(item)]));
  }
  return value;
}
