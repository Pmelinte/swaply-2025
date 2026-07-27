import type {
  ClassifyItemRequest,
  ClassifyItemResult,
  EstimateValueRequest,
  EstimateValueResult,
  GenerateItemDescriptionRequest,
  GenerateItemDescriptionResult,
  MatchExplanationRequest,
  MatchExplanationResult,
  TranslateTextRequest,
  TranslateTextResult,
} from "./contracts";

const DEFAULT_CATEGORY = "objects";
const DEFAULT_CURRENCY = "EUR";

export function fallbackClassifyItem(request: ClassifyItemRequest): ClassifyItemResult {
  const title = normalizeText(request.titleHint);
  const description = normalizeText(request.descriptionHint);
  const tags = buildFallbackTags([title, description]);

  return {
    category: DEFAULT_CATEGORY,
    subcategory: null,
    tags,
    confidence: 0,
    source: "fallback",
    notes: "AI classification is unavailable, so the item remains in the generic Objects category until reviewed.",
  };
}

export function fallbackGenerateItemDescription(
  request: GenerateItemDescriptionRequest,
): GenerateItemDescriptionResult {
  const title = normalizeText(request.title) || "Untitled swap item";
  const category = normalizeText(request.category) || DEFAULT_CATEGORY;
  const condition = normalizeText(request.condition) || "condition not specified";
  const userNotes = normalizeText(request.userNotes);

  return {
    title,
    description: userNotes
      ? `${title}. Category: ${category}. Condition: ${condition}. Notes from owner: ${userNotes}`
      : `${title}. Category: ${category}. Condition: ${condition}. Add more details before publishing.`,
    tags: buildFallbackTags([title, category, condition]),
    source: "fallback",
  };
}

export function fallbackEstimateValue(request: EstimateValueRequest): EstimateValueResult {
  return {
    amount: null,
    currency: normalizeText(request.currency) || DEFAULT_CURRENCY,
    confidence: 0,
    source: "fallback",
    explanation: "Value estimation is unavailable. Ask the owner to set an approximate value or compare similar listings manually.",
  };
}

export function fallbackTranslateText(request: TranslateTextRequest): TranslateTextResult {
  return {
    text: request.text,
    originalText: request.text,
    translatedText: request.text,
    sourceLocale: request.sourceLocale,
    targetLocale: request.targetLocale,
    source: "fallback",
    warning: `Automatic translation from ${request.sourceLocale} to ${request.targetLocale} is unavailable. Original text was preserved.`,
  };
}

export function fallbackMatchExplanation(request: MatchExplanationRequest): MatchExplanationResult {
  const offered = normalizeText(request.offeredItem?.title ?? request.offeredTitle) || "offered item";
  const requested = normalizeText(request.requestedItem?.title ?? request.requestedTitle) || "requested item";
  const offeredCategory = normalizeText(request.offeredItem?.category ?? request.offeredCategory);
  const requestedCategory = normalizeText(request.requestedItem?.category ?? request.requestedCategory);
  const sameCategory = Boolean(offeredCategory && requestedCategory && offeredCategory === requestedCategory);
  const distanceReason = typeof request.distanceKm === "number"
    ? `Approximate distance: ${Math.round(request.distanceKm)} km.`
    : "Distance was not available.";
  const baseScore = typeof request.baseScore === "number" ? request.baseScore : 0;
  const semanticScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  return {
    score: 0,
    semanticScore,
    scoreAdjustment: 0,
    summary: `Manual review is required because semantic analysis is unavailable for the proposed swap between ${offered} and ${requested}.`,
    reasons: [
      `Manual review needed between ${offered} and ${requested}.`,
      sameCategory ? "The items share the same category." : "The local algorithm remains the source of truth.",
      distanceReason,
    ],
    risks: ["No active semantic provider analysed the descriptions, value, condition or logistics."],
    confidence: "low",
    source: "fallback",
  };
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function buildFallbackTags(values: string[]) {
  const words = values
    .flatMap((value) => value.toLowerCase().split(/[^a-z0-9ăâîșț]+/iu))
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);

  return Array.from(new Set(words)).slice(0, 5);
}