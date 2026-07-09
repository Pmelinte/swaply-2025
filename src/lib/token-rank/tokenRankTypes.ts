export type SwaplyRank = "free" | "silver" | "gold" | "platinum";

export type TokenLedgerReason =
  | "welcome_grant"
  | "story_reward"
  | "exchange_completion_reward"
  | "premium_pack_purchase"
  | "ai_feature_usage"
  | "listing_boost"
  | "courier_support"
  | "manual_adjustment";

export type TokenLedgerDirection = "credit" | "debit";

export type TrustSignalReason =
  | "completed_exchange"
  | "positive_feedback"
  | "verified_profile"
  | "dispute_penalty"
  | "policy_violation_penalty"
  | "long_term_good_behavior";

export interface TokenLedgerEntry {
  id: string;
  userId: string;
  direction: TokenLedgerDirection;
  amount: number;
  currency: "swapleni";
  reason: TokenLedgerReason;
  relatedExchangeId?: string | null;
  relatedStoryId?: string | null;
}

export interface TrustSignalEntry {
  id: string;
  userId: string;
  reason: TrustSignalReason;
  points: number;
  relatedExchangeId?: string | null;
  relatedModerationCaseId?: string | null;
}

export interface RankEvaluationInput {
  userId: string;
  currentRank: SwaplyRank;
  trustSignals: TrustSignalEntry[];
  completedExchangeCount: number;
  unresolvedDisputeCount: number;
  severePolicyViolationCount: number;
}

export interface RankEvaluationResult {
  userId: string;
  recommendedRank: SwaplyRank;
  trustScore: number;
  reasons: string[];
  tokensIgnoredForRank: true;
  requiresHumanReview: boolean;
}

export interface TokenBalanceSnapshot {
  userId: string;
  balance: number;
  currency: "swapleni";
  ledgerEntryIds: string[];
}

export const SWAPLY_RANKS: readonly SwaplyRank[] = ["free", "silver", "gold", "platinum"] as const;
