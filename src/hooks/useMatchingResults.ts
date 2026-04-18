"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppState } from "@/lib/state";
import { calculateMatchScore } from "@/lib/matching/score";
import type { Item } from "@/lib/types";

export interface ScoredItem {
  item: Item;
  score: number;
  tier: "strong" | "good" | "possible" | "weak";
  breakdown: ReturnType<typeof calculateMatchScore>["factors"];
  tooltipLines: string[];
}

function scoreTier(score: number): ScoredItem["tier"] {
  if (score >= 75) return "strong";
  if (score >= 50) return "good";
  if (score >= 25) return "possible";
  return "weak";
}

export type SortOrder = "score" | "newest" | "value_asc" | "value_desc";

const VALUE_ORDER: Record<string, number> = {
  small: 1, medium: 2, large: 3, sentimental: 2,
};

/**
 * Queries and scores candidate items against the active slot items.
 * Runs purely client-side using the loaded items from AppState.
 */
export function useMatchingResults(
  slotItems: Item[],
  sort: SortOrder = "score",
  categoryFilter: string | null = null,
) {
  const { user, items, loading } = useAppState();
  const [scoredItems, setScoredItems] = useState<ScoredItem[]>([]);

  const candidates = useMemo(() => {
    if (!slotItems.length || !user) return [];
    return items.filter(
      (i) =>
        i.isActive &&
        i.status === "active" &&
        i.ownerId !== user.id &&
        (!categoryFilter || i.category === categoryFilter),
    );
  }, [items, user, slotItems, categoryFilter]);

  useEffect(() => {
    if (!slotItems.length || !user) {
      setScoredItems([]);
      return;
    }

    // Score each candidate against each slot item; take the best score
    const scored = candidates.map((candidate): ScoredItem => {
      let bestScore = 0;
      let bestBreakdown: ScoredItem["breakdown"] = [];
      let bestTooltip: string[] = [];

      for (const slot of slotItems) {
        const result = calculateMatchScore(slot, candidate, null, null);
        if (result.total > bestScore) {
          bestScore = result.total;
          bestBreakdown = result.factors;
          bestTooltip = result.tooltipLines;
        }
      }

      return {
        item: candidate,
        score: bestScore,
        tier: scoreTier(bestScore),
        breakdown: bestBreakdown,
        tooltipLines: bestTooltip,
      };
    });

    // Apply sort
    scored.sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
        case "value_asc":
          return (VALUE_ORDER[a.item.perceivedValue ?? "medium"] ?? 2) -
                 (VALUE_ORDER[b.item.perceivedValue ?? "medium"] ?? 2);
        case "value_desc":
          return (VALUE_ORDER[b.item.perceivedValue ?? "medium"] ?? 2) -
                 (VALUE_ORDER[a.item.perceivedValue ?? "medium"] ?? 2);
        default:
          return b.score - a.score;
      }
    });

    setScoredItems(scored);
  }, [candidates, slotItems, user, sort]);

  return { scoredItems, loading: loading.items };
}
