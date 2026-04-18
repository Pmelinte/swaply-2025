"use client";

import { useState, useCallback } from "react";
import { useAppState } from "@/lib/state";
import { calculateMatchScore } from "@/lib/matching/matchScore";
import type { Item } from "@/lib/types";
import type { ScoredItem } from "./useMatchingResults";

function scoreTier(score: number): ScoredItem["tier"] {
  if (score >= 75) return "strong";
  if (score >= 50) return "good";
  if (score >= 25) return "possible";
  return "weak";
}

/**
 * AI matching hook: picks 2 suggestions from a wider candidate pool
 * (no category restriction, relaxed criteria) on each call.
 *
 * Each call to `fetchSuggestions` cycles through the pool so the user
 * gets different results on every click.
 */
export function useMatchingAI(slotItems: Item[]) {
  const { user, items } = useAppState();
  const [suggestions, setSuggestions] = useState<ScoredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);

  const fetchSuggestions = useCallback(() => {
    if (!slotItems.length || !user) return;
    setLoading(true);

    // Simulate async AI call with a short delay
    setTimeout(() => {
      const candidates = items.filter(
        (i) => i.isActive && i.status === "active" && i.ownerId !== user.id,
      );

      // Score all with relaxed criteria (use existing score.ts)
      const scored = candidates
        .map((candidate): ScoredItem => {
          let bestScore = 0;
          for (const slot of slotItems) {
            const result = calculateMatchScore(slot, candidate, null, null);
            if (result.total > bestScore) bestScore = result.total;
          }
          const result = calculateMatchScore(slotItems[0], candidate, null, null);
          return {
            item: candidate,
            score: bestScore,
            tier: scoreTier(bestScore),
            breakdown: result.factors,
            tooltipLines: result.tooltipLines,
          };
        })
        .sort((a, b) => b.score - a.score);

      // Pick 2 from the sorted list at the current offset
      const PAGE_SIZE = 2;
      const start = pageOffset % Math.max(1, scored.length);
      const page = [
        ...scored.slice(start, start + PAGE_SIZE),
        ...scored.slice(0, Math.max(0, start + PAGE_SIZE - scored.length)),
      ].slice(0, PAGE_SIZE);

      setSuggestions(page);
      setPageOffset((prev) => prev + PAGE_SIZE);
      setLoading(false);
    }, 1200);
  }, [slotItems, user, items, pageOffset]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setPageOffset(0);
  }, []);

  return { suggestions, loading, fetchSuggestions, clearSuggestions };
}
