import { z } from "zod";
import { CATEGORIES_TAXONOMY, CATEGORY_NAMES } from "@/lib/categories";
import type { AIProvider } from "./gateway";
import type { AITaskType } from "./taskTypes";
import type { ClassifyItemResult } from "./contracts";

const TAG_CANDIDATES = [
  "tech", "gaming", "audio", "video", "laptop", "phone", "tablet", "monitor",
  "sport", "outdoor", "camping", "hiking", "fitness", "bike", "running",
  "lego", "puzzle", "boardgame", "music", "guitar", "art", "drone",
  "books", "manga", "vinyl", "dvd", "cooking", "education",
  "garden", "tools", "home", "kitchen", "lamp", "decor", "furniture",
  "fashion", "leather", "watch", "sunglasses", "bag", "shoes", "accessories",
  "vintage", "handmade", "eco", "portable", "wireless", "retro",
];

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

export function createHuggingFaceProvider(apiKey: string | undefined): AIProvider {
  return {
    id: "huggingface",
    model: "facebook/bart-large-mnli+unitary/toxic-bert",
    external: true,
    supports: (taskType) => taskType === "classify_item" || taskType === "moderate_chat",
    async run(request, context) {
      if (!apiKey) throw new Error("missing_huggingface_key");
      if (request.taskType === "classify_item") return runClassify(request.input, apiKey, context.signal);
      if (request.taskType === "moderate_chat") return runModerate(request.input, apiKey, context.signal);
      throw new Error("unsupported_task");
    },
  };
}

export function createDeterministicFallbackProvider(): AIProvider {
  return {
    id: "deterministic-fallback",
    model: "swaply-rules-v1",
    supports: (taskType: AITaskType) => taskType === "classify_item" || taskType === "moderate_chat",
    async run(request) {
      if (request.taskType === "classify_item") return fallbackClassify(request.input);
      if (request.taskType === "moderate_chat") return fallbackModerate(request.input);
      throw new Error("unsupported_task");
    },
  };
}

async function runClassify(input: unknown, apiKey: string, signal: AbortSignal) {
  const parsed = classifyInputSchema.parse(input);
  const text = [parsed.titleHint, parsed.descriptionHint].filter(Boolean).join(". ");
  if (!text) return fallbackClassify(parsed);

  const [categoryResult, tagsResult] = await Promise.all([
    fetchZeroShot(text, CATEGORY_NAMES, apiKey, signal),
    fetchZeroShot(text, TAG_CANDIDATES, apiKey, signal, true),
  ]);

  const output: ClassifyItemResult = {
    category: categoryResult.labels[0] ?? keywordCategory(text),
    subcategory: null,
    tags: tagsResult.labels.filter((_, index) => (tagsResult.scores[index] ?? 0) > 0.15).slice(0, 5),
    confidence: categoryResult.scores[0] ?? 0.5,
    source: "ai",
    notes: "Classified through the server-side AI gateway.",
  };

  if (output.tags.length === 0) output.tags = keywordTags(text);
  return classifyOutputSchema.parse(output);
}

async function runModerate(input: unknown, apiKey: string, signal: AbortSignal) {
  const parsed = moderateInputSchema.parse(input);
  const deterministic = fallbackModerate(parsed);
  if (!deterministic.safe) return deterministic;

  const res = await fetch("https://api-inference.huggingface.co/models/unitary/toxic-bert", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: parsed.text }),
    signal,
  });
  if (!res.ok) return deterministic;
  const data = await res.json();
  const results = Array.isArray(data?.[0]) ? data[0] : [];
  const toxic = results.some((entry: { label?: string; score?: number }) => entry.label === "toxic" && Number(entry.score) > 0.7);
  return moderateOutputSchema.parse(toxic ? { safe: false, flags: ["toxic_ai"], message: "Mesaj blocat: toxic_ai" } : deterministic);
}

async function fetchZeroShot(text: string, labels: string[], apiKey: string, signal: AbortSignal, multiLabel = false) {
  const res = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: text, parameters: { candidate_labels: labels, multi_label: multiLabel } }),
    signal,
  });
  if (!res.ok) throw new Error("huggingface_zero_shot_failed");
  const data = await res.json();
  return {
    labels: z.array(z.string()).catch([]).parse(data.labels),
    scores: z.array(z.number()).catch([]).parse(data.scores),
  };
}

function fallbackClassify(input: unknown) {
  const parsed = classifyInputSchema.catch({}).parse(input);
  const text = [parsed.titleHint, parsed.descriptionHint].filter(Boolean).join(". ");
  return classifyOutputSchema.parse({
    category: keywordCategory(text),
    subcategory: null,
    tags: keywordTags(text),
    confidence: 0.45,
    source: "fallback",
    notes: "Deterministic fallback; no provider key or provider failed.",
  });
}

function fallbackModerate(input: unknown) {
  const { text } = moderateInputSchema.catch({ text: "" }).parse(input);
  const flags: string[] = [];
  if (/\b\d{10,}\b/.test(text) || /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) flags.push("date_personale");
  if (text.length > 500) flags.push("mesaj_prea_lung");
  if (/(.)\1{5,}/.test(text)) flags.push("spam_caractere");
  if ((text.match(/https?:\/\//g) || []).length > 2) flags.push("spam_linkuri");
  return moderateOutputSchema.parse({ safe: flags.length === 0, flags, message: flags.length ? `Mesaj blocat: ${flags.join(", ")}` : undefined });
}

function keywordCategory(text: string): string {
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const category of CATEGORIES_TAXONOMY) {
    if (category.keywords.some((keyword) => normalized.includes(keyword))) return category.name;
  }
  return "hobby_games";
}

function keywordTags(text: string): string[] {
  const normalized = text.toLowerCase();
  return TAG_CANDIDATES.filter((tag) => normalized.includes(tag)).slice(0, 5);
}
