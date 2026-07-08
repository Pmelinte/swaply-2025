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
    source: "fallback",
    warning: `Automatic translation from ${request.sourceLocale} to ${request.targetLocale} is unavailable. Original text was preserved.`,
  };
}

export function fallbackMatchExplanation(request: MatchExplanationRequest): MatchExplanationResult {
  const offered = normalizeText(request.offeredTitle) || "offered item";
  const requested = normalizeText(request.requestedTitle) || "requested item";
  const distanceReason = typeof request.distanceKm === "number"
    ? `Approximate distance: ${Math.round(request.distanceKm)} km.`
    : "Distance was not available.";

  return {
    score: 0,
    reasons: [
      `Manual review needed between ${offered} and ${requested}.`,
      distanceReason,
    ],
    risks: ["AI match explanation is unavailable, so the user should verify value, condition and logistics manually."],
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
