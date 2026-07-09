export type SentimentalValueLevel = "none" | "low" | "medium" | "high" | "legacy";

export type ObjectStoryVisibility = "private" | "exchange_partner" | "community" | "public_story_after_consent";

export type SwapIntention =
  | "balanced_value"
  | "quick_practical_swap"
  | "meaningful_swap"
  | "second_life"
  | "local_community"
  | "repair_reuse"
  | "careful_keeper"
  | "practical_daily_use";

export type RecipientUseIntent =
  | "direct_use"
  | "repair_or_reuse"
  | "collection_care"
  | "community_project"
  | "creative_project"
  | "professional_use"
  | "no_preference";

export interface HumanCenteredItemContext {
  sentimentalValueLevel: SentimentalValueLevel;
  objectStory?: string | null;
  whyISwapIt?: string | null;
  preferredUseIntent?: RecipientUseIntent | null;
  avoidImmediateResale?: boolean;
  wantsRecipientMessage?: boolean;
  storyVisibility: ObjectStoryVisibility;
  swapIntentions: SwapIntention[];
  secondLifeTag?: boolean;
}

export interface RecipientInterestContext {
  itemId: string;
  requesterId: string;
  whyIWantIt?: string | null;
  intendedUse?: RecipientUseIntent | null;
  canRepairOrReuse?: boolean;
  agreesToOwnerPreference?: boolean;
}

export interface MeaningMatchSignals {
  economicFit: number;
  logisticsFit: number;
  categoryFit: number;
  intentionFit: number;
  sentimentalFit: number;
  languageFit: number;
  trustFit: number;
  riskScore: number;
}

export interface MeaningMatchExplanation {
  advisoryOnly: true;
  score: number;
  signals: MeaningMatchSignals;
  reasons: string[];
  privacyNotes: string[];
  humanDecisionRequired: true;
}

export const SENTIMENTAL_VALUE_LEVELS: readonly SentimentalValueLevel[] = [
  "none",
  "low",
  "medium",
  "high",
  "legacy",
] as const;

export const SWAP_INTENTIONS: readonly SwapIntention[] = [
  "balanced_value",
  "quick_practical_swap",
  "meaningful_swap",
  "second_life",
  "local_community",
  "repair_reuse",
  "careful_keeper",
  "practical_daily_use",
] as const;

export const RECIPIENT_USE_INTENTS: readonly RecipientUseIntent[] = [
  "direct_use",
  "repair_or_reuse",
  "collection_care",
  "community_project",
  "creative_project",
  "professional_use",
  "no_preference",
] as const;
