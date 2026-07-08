import type {
  RankEvaluationInput,
  RankEvaluationResult,
  SwaplyRank,
  TokenBalanceSnapshot,
  TokenLedgerEntry,
} from "./tokenRankTypes";

const RANK_THRESHOLDS: Record<SwaplyRank, number> = {
  free: 0,
  silver: 150,
  gold: 400,
  platinum: 850,
};

export function calculateTokenBalance(entries: readonly TokenLedgerEntry[]): TokenBalanceSnapshot {
  const balance = entries.reduce((total, entry) => {
    return entry.direction === "credit" ? total + entry.amount : total - entry.amount;
  }, 0);

  return {
    userId: entries[0]?.userId ?? "unknown",
    balance,
    currency: "swapleni",
    ledgerEntryIds: entries.map((entry) => entry.id),
  };
}

export function calculateTrustScore(input: RankEvaluationInput) {
  const signalPoints = input.trustSignals.reduce((total, signal) => total + signal.points, 0);
  const exchangePoints = input.completedExchangeCount * 25;
  const disputePenalty = input.unresolvedDisputeCount * 150;
  const severePenalty = input.severePolicyViolationCount * 300;

  return Math.max(0, signalPoints + exchangePoints - disputePenalty - severePenalty);
}

export function evaluateRank(input: RankEvaluationInput): RankEvaluationResult {
  const trustScore = calculateTrustScore(input);
  const recommendedRank = getRankForTrustScore(trustScore);
  const reasons = [
    `Trust score is ${trustScore}.`,
    "Tokens are ignored for rank evaluation.",
    "Rank is based on trust, completed exchanges, feedback, verification and safety signals.",
  ];

  if (input.unresolvedDisputeCount > 0) {
    reasons.push("Unresolved disputes prevent automatic rank promotion.");
  }

  if (input.severePolicyViolationCount > 0) {
    reasons.push("Severe policy violations require human review.");
  }

  return {
    userId: input.userId,
    recommendedRank,
    trustScore,
    reasons,
    tokensIgnoredForRank: true,
    requiresHumanReview: input.unresolvedDisputeCount > 0 || input.severePolicyViolationCount > 0,
  };
}

export function getRankForTrustScore(score: number): SwaplyRank {
  if (score >= RANK_THRESHOLDS.platinum) return "platinum";
  if (score >= RANK_THRESHOLDS.gold) return "gold";
  if (score >= RANK_THRESHOLDS.silver) return "silver";
  return "free";
}

export function canPurchaseRank() {
  return false;
}

export function canConvertTokensToRank() {
  return false;
}

export function canSpendTokensForUtility(reason: TokenLedgerEntry["reason"]) {
  return reason === "ai_feature_usage" || reason === "listing_boost" || reason === "courier_support";
}

export function isRankPenaltyReason(reason: string) {
  return reason === "dispute_penalty" || reason === "policy_violation_penalty";
}
