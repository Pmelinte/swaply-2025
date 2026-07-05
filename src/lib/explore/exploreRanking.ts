export type ExploreFeedItem = {
  id: string;
  created_at?: string | null;
  approximate_value?: number | null;
  location_country?: string | null;
  category?: string | null;
  ai_metadata?: Record<string, unknown> | null;
  owner?: {
    rating?: number | null;
    trust_score?: number | null;
    completion_rate?: number | null;
  } | null;
};

export type ExploreRankingInput = {
  item: ExploreFeedItem;
  preferredCountry?: string | null;
  preferredCategories?: string[];
};

export function calculateExploreScore(input: ExploreRankingInput): number {
  const { item } = input;

  let score = 0;

  const createdAt = item.created_at ? new Date(item.created_at).getTime() : 0;
  const ageHours = Math.max(1, (Date.now() - createdAt) / 36e5);

  score += Math.max(0, 40 - ageHours * 0.3);

  const trust = item.owner?.trust_score ?? 50;
  score += trust * 0.25;

  const rating = item.owner?.rating ?? 3;
  score += rating * 6;

  const completion = item.owner?.completion_rate ?? 50;
  score += completion * 0.12;

  if (
    input.preferredCountry &&
    item.location_country &&
    item.location_country.toLowerCase() === input.preferredCountry.toLowerCase()
  ) {
    score += 15;
  }

  if (
    input.preferredCategories?.length &&
    item.category &&
    input.preferredCategories.some(
      (entry) => entry.toLowerCase() === item.category?.toLowerCase(),
    )
  ) {
    score += 20;
  }

  const value = item.approximate_value ?? 0;
  if (value > 0 && value < 10000) {
    score += Math.min(15, value / 300);
  }

  const aiBoost = Number(item.ai_metadata?.quality_score ?? 0);
  score += aiBoost * 0.15;

  return Math.round(score * 100) / 100;
}

export function sortExploreFeed(
  items: ExploreFeedItem[],
  options?: {
    preferredCountry?: string | null;
    preferredCategories?: string[];
  },
): Array<ExploreFeedItem & { explore_score: number }> {
  return items
    .map((item) => ({
      ...item,
      explore_score: calculateExploreScore({
        item,
        preferredCountry: options?.preferredCountry,
        preferredCategories: options?.preferredCategories,
      }),
    }))
    .sort((a, b) => b.explore_score - a.explore_score);
}
