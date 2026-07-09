export type AIFallbackSource = "ai" | "fallback";

export interface AIImageReference {
  url?: string;
  cloudinaryPublicId?: string;
  mimeType?: string;
}

export interface ClassifyItemRequest {
  titleHint?: string;
  descriptionHint?: string;
  images?: AIImageReference[];
  locale?: string;
}

export interface ClassifyItemResult {
  category: string;
  subcategory: string | null;
  tags: string[];
  confidence: number;
  source: AIFallbackSource;
  notes: string;
}

export interface GenerateItemDescriptionRequest {
  title: string;
  category?: string | null;
  subcategory?: string | null;
  condition?: string | null;
  userNotes?: string | null;
  locale?: string;
}

export interface GenerateItemDescriptionResult {
  title: string;
  description: string;
  tags: string[];
  source: AIFallbackSource;
}

export interface EstimateValueRequest {
  title: string;
  category?: string | null;
  condition?: string | null;
  countryCode?: string | null;
  currency?: string | null;
}

export interface EstimateValueResult {
  amount: number | null;
  currency: string;
  confidence: number;
  source: AIFallbackSource;
  explanation: string;
}

export interface TranslateTextRequest {
  text: string;
  sourceLocale: string;
  targetLocale: string;
  preserveTone?: boolean;
}

export interface TranslateTextResult {
  text: string;
  source: AIFallbackSource;
  warning?: string;
}

export interface MatchExplanationRequest {
  offeredTitle: string;
  requestedTitle: string;
  offeredCategory?: string | null;
  requestedCategory?: string | null;
  distanceKm?: number | null;
  locale?: string;
}

export interface MatchExplanationResult {
  score: number;
  reasons: string[];
  risks: string[];
  source: AIFallbackSource;
}

export type SwaplyAITaskRequest =
  | ClassifyItemRequest
  | GenerateItemDescriptionRequest
  | EstimateValueRequest
  | TranslateTextRequest
  | MatchExplanationRequest;

export type SwaplyAITaskResult =
  | ClassifyItemResult
  | GenerateItemDescriptionResult
  | EstimateValueResult
  | TranslateTextResult
  | MatchExplanationResult;
