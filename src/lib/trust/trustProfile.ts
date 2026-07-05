export type TrustRank = "Free" | "Silver" | "Gold" | "Platinum";
export type RiskLevel = "low" | "medium" | "high";

export type TrustProfileInput = {
  rating?: number | null;
  rating_count?: number | null;
  trust_score?: number | null;
  completion_rate?: number | null;
  completed_swaps?: number | null;
};

export type PublicTrustProfile = {
  rank: TrustRank;
  risk_level: RiskLevel;
  public_score: number;
  rating: number;
  rating_count: number;
  trust_score: number;
  completion_rate: number;
  completed_swaps: number;
  summary: string;
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function calculatePublicTrustProfile(input: TrustProfileInput): PublicTrustProfile {
  const rating = input.rating ?? 0;
  const ratingCount = input.rating_count ?? 0;
  const trustScore = clamp(input.trust_score ?? 0);
  const completionRate = clamp(input.completion_rate ?? 0);
  const completedSwaps = input.completed_swaps ?? 0;

  const publicScore = Math.round(
    trustScore * 0.45 +
      completionRate * 0.25 +
      Math.min(100, rating * 20) * 0.2 +
      Math.min(100, completedSwaps * 8) * 0.1,
  );

  let rank: TrustRank = "Free";
  if (publicScore >= 85 && completedSwaps >= 10 && rating >= 4.6) rank = "Platinum";
  else if (publicScore >= 70 && completedSwaps >= 5 && rating >= 4.2) rank = "Gold";
  else if (publicScore >= 50 && completedSwaps >= 2) rank = "Silver";

  let risk_level: RiskLevel = "low";
  if (publicScore < 40 || trustScore < 35 || completionRate < 40) risk_level = "high";
  else if (publicScore < 65 || trustScore < 60 || completionRate < 70) risk_level = "medium";

  const summary =
    rank === "Platinum"
      ? "Excellent reputation with repeated successful exchanges."
      : rank === "Gold"
        ? "Strong reputation and reliable exchange history."
        : rank === "Silver"
          ? "Growing reputation with confirmed exchange activity."
          : "New or limited reputation profile.";

  return {
    rank,
    risk_level,
    public_score: publicScore,
    rating,
    rating_count: ratingCount,
    trust_score: trustScore,
    completion_rate: completionRate,
    completed_swaps: completedSwaps,
    summary,
  };
}
