import { describe, expect, it } from "vitest";
import {
  calculateTokenBalance,
  canConvertTokensToRank,
  canPurchaseRank,
  canSpendTokensForUtility,
  evaluateRank,
  getRankForTrustScore,
  isRankPenaltyReason,
} from "@/lib/token-rank/tokenRankPolicy";
import { RANK_EVALUATION_EXAMPLES, TOKEN_LEDGER_EXAMPLES } from "@/lib/token-rank/tokenRankSeeds";
import { SWAPLY_RANKS } from "@/lib/token-rank/tokenRankTypes";

describe("token and rank separation policy", () => {
  it("defines the expected rank order", () => {
    expect(SWAPLY_RANKS).toEqual(["free", "silver", "gold", "platinum"]);
  });

  it("calculates token balance independently from rank", () => {
    const balance = calculateTokenBalance(TOKEN_LEDGER_EXAMPLES);

    expect(balance.userId).toBe("demo-user-a");
    expect(balance.balance).toBe(65);
    expect(balance.currency).toBe("swapleni");
  });

  it("does not allow rank purchase or token conversion into rank", () => {
    expect(canPurchaseRank()).toBe(false);
    expect(canConvertTokensToRank()).toBe(false);
  });

  it("allows token spending only for utility reasons", () => {
    expect(canSpendTokensForUtility("ai_feature_usage")).toBe(true);
    expect(canSpendTokensForUtility("listing_boost")).toBe(true);
    expect(canSpendTokensForUtility("courier_support")).toBe(true);
    expect(canSpendTokensForUtility("premium_pack_purchase")).toBe(false);
    expect(canSpendTokensForUtility("story_reward")).toBe(false);
  });

  it("evaluates rank using trust signals while ignoring tokens", () => {
    const evaluation = evaluateRank(RANK_EVALUATION_EXAMPLES[0]);

    expect(evaluation.tokensIgnoredForRank).toBe(true);
    expect(evaluation.trustScore).toBe(400);
    expect(evaluation.recommendedRank).toBe("gold");
    expect(evaluation.requiresHumanReview).toBe(false);
  });

  it("requires human review when unresolved disputes exist", () => {
    const evaluation = evaluateRank(RANK_EVALUATION_EXAMPLES[1]);

    expect(evaluation.requiresHumanReview).toBe(true);
    expect(evaluation.reasons.join(" ")).toContain("Unresolved disputes");
  });

  it("maps trust score to rank thresholds", () => {
    expect(getRankForTrustScore(0)).toBe("free");
    expect(getRankForTrustScore(150)).toBe("silver");
    expect(getRankForTrustScore(400)).toBe("gold");
    expect(getRankForTrustScore(850)).toBe("platinum");
  });

  it("identifies rank penalty reasons", () => {
    expect(isRankPenaltyReason("dispute_penalty")).toBe(true);
    expect(isRankPenaltyReason("policy_violation_penalty")).toBe(true);
    expect(isRankPenaltyReason("story_reward")).toBe(false);
  });
});
