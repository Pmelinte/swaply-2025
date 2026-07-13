import type { MatchingItemRow } from "./matchQueries";

export type SelectedInterest = {
  itemId: string;
  ownerId: string;
  item: MatchingItemRow;
  score: number;
  interestId?: string;
};

export type MatchingFilters = {
  category: string | null;
  itemType: string | null;
  maxDistanceKm: number | null;
  crossCategory: boolean;
};

export const DEFAULT_FILTERS: MatchingFilters = {
  category: null,
  itemType: null,
  maxDistanceKm: null,
  crossCategory: false,
};

export type SortOrder = "relevant" | "newest" | "value_asc" | "value_desc";
