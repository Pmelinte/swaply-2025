import type { RankEvaluationInput, TokenLedgerEntry } from "./tokenRankTypes";

export const TOKEN_LEDGER_EXAMPLES = [
  {
    id: "token-entry-welcome",
    userId: "demo-user-a",
    direction: "credit",
    amount: 50,
    currency: "swapleni",
    reason: "welcome_grant",
    relatedExchangeId: null,
    relatedStoryId: null,
  },
  {
    id: "token-entry-ai-usage",
    userId: "demo-user-a",
    direction: "debit",
    amount: 5,
    currency: "swapleni",
    reason: "ai_feature_usage",
    relatedExchangeId: null,
    relatedStoryId: null,
  },
  {
    id: "token-entry-story",
    userId: "demo-user-a",
    direction: "credit",
    amount: 20,
    currency: "swapleni",
    reason: "story_reward",
    relatedExchangeId: "exchange-demo-a",
    relatedStoryId: "story-demo-a",
  },
] as const satisfies readonly TokenLedgerEntry[];

export const RANK_EVALUATION_EXAMPLES = [
  {
    userId: "demo-user-a",
    currentRank: "free",
    completedExchangeCount: 8,
    unresolvedDisputeCount: 0,
    severePolicyViolationCount: 0,
    trustSignals: [
      {
        id: "trust-positive-feedback",
        userId: "demo-user-a",
        reason: "positive_feedback",
        points: 120,
        relatedExchangeId: "exchange-demo-a",
        relatedModerationCaseId: null,
      },
      {
        id: "trust-verified-profile",
        userId: "demo-user-a",
        reason: "verified_profile",
        points: 80,
        relatedExchangeId: null,
        relatedModerationCaseId: null,
      },
    ],
  },
  {
    userId: "demo-user-b",
    currentRank: "gold",
    completedExchangeCount: 20,
    unresolvedDisputeCount: 1,
    severePolicyViolationCount: 0,
    trustSignals: [
      {
        id: "trust-dispute-penalty",
        userId: "demo-user-b",
        reason: "dispute_penalty",
        points: -120,
        relatedExchangeId: "exchange-disputed-b",
        relatedModerationCaseId: "moderation-demo-b",
      },
    ],
  },
] as const satisfies readonly RankEvaluationInput[];
