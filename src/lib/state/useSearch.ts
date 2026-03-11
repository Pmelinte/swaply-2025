/**
 * Advanced search & discovery hook.
 * Supports full-text search, category/condition/location filters, sorting.
 */
import { useCallback, useMemo, useState } from "react";
import type { Item, SearchFilters, SearchResult } from "../types";

interface UseSearchParams {
  items: Item[];
  userId: string | null;
  userCoordinates?: { lat: number; lng: number };
}

/** Get distance for an item (returns Infinity if no coordinates) */
function getItemDistance(
  _item: Item,
  _coords: { lat: number; lng: number },
): number {
  // Items don't have coordinates in the current schema, so we'd need to
  // geocode the location string. For now, return a large number.
  // In production, items would have lat/lng from geocoding.
  return Infinity;
}

/** Haversine distance in km */
function _haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DEFAULT_FILTERS: SearchFilters = {
  query: "",
  sortBy: "relevance",
};

export function useSearch({ items, userId, userCoordinates }: UseSearchParams) {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [savedSearches, setSavedSearches] = useState<SearchFilters[]>([]);

  /** Compute text relevance score (0-1) */
  const computeRelevance = useCallback(
    (item: Item, query: string): number => {
      if (!query) return 0.5; // neutral when no query

      const q = query.toLowerCase();
      const title = item.title.toLowerCase();
      const desc = item.description.toLowerCase();
      const category = item.category.toLowerCase();
      const tags = [...(item.aiSuggestedTags ?? []), ...(item.userFinalTags ?? [])]
        .join(" ")
        .toLowerCase();

      let score = 0;

      // Exact title match
      if (title === q) score += 1.0;
      // Title contains query
      else if (title.includes(q)) score += 0.7;
      // Category match
      if (category.includes(q)) score += 0.3;
      // Description contains query
      if (desc.includes(q)) score += 0.2;
      // Tags contain query
      if (tags.includes(q)) score += 0.15;

      // Word-level matching
      const words = q.split(/\s+/).filter(Boolean);
      for (const word of words) {
        if (title.includes(word)) score += 0.1;
        if (desc.includes(word)) score += 0.05;
      }

      return Math.min(score, 1.0);
    },
    [],
  );

  /** Filtered & sorted results */
  const results = useMemo((): SearchResult[] => {
    let filtered = items.filter(
      (item) =>
        item.isActive &&
        item.status === "active" &&
        item.ownerId !== userId, // don't show own items in search
    );

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((item) => item.category === filters.category);
    }

    // Condition filter
    if (filters.condition) {
      filtered = filtered.filter((item) => item.condition === filters.condition);
    }

    // Listing type filter
    if (filters.listingType) {
      filtered = filtered.filter((item) => (item.listingType ?? "object") === filters.listingType);
    }

    // Location filter (text match)
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(
        (item) => item.location.toLowerCase().includes(loc),
      );
    }

    // Text search filter — score and filter
    let scored: SearchResult[];
    if (filters.query.trim()) {
      scored = filtered
        .map((item) => ({
          item,
          relevance: computeRelevance(item, filters.query),
        }))
        .filter((r) => r.relevance > 0.05);
    } else {
      scored = filtered.map((item) => ({ item, relevance: 0.5 }));
    }

    // Sort
    switch (filters.sortBy) {
      case "relevance":
        scored.sort((a, b) => b.relevance - a.relevance);
        break;
      case "date":
        scored.sort(
          (a, b) =>
            new Date(b.item.createdAt).getTime() -
            new Date(a.item.createdAt).getTime(),
        );
        break;
      case "distance":
        if (userCoordinates) {
          scored.sort((a, b) => {
            const distA = getItemDistance(a.item, userCoordinates);
            const distB = getItemDistance(b.item, userCoordinates);
            return distA - distB;
          });
        }
        break;
    }

    // Max distance filter
    if (filters.maxDistance && userCoordinates) {
      scored = scored.filter((r) => {
        const dist = getItemDistance(r.item, userCoordinates);
        return dist <= (filters.maxDistance ?? Infinity);
      });
    }

    return scored;
  }, [items, userId, filters, userCoordinates, computeRelevance]);

  /** Update filters */
  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  /** Clear all filters */
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /** Save current search */
  const saveSearch = useCallback(() => {
    if (!filters.query && !filters.category && !filters.location) return;
    setSavedSearches((prev) => {
      // Avoid duplicates
      const exists = prev.some(
        (s) =>
          s.query === filters.query &&
          s.category === filters.category &&
          s.location === filters.location,
      );
      if (exists) return prev;
      return [filters, ...prev].slice(0, 10); // max 10 saved
    });
  }, [filters]);

  /** Remove saved search */
  const removeSavedSearch = useCallback((index: number) => {
    setSavedSearches((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /** Category counts for faceted search */
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.isActive && item.status === "active" && item.ownerId !== userId) {
        counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));
  }, [items, userId]);

  /** Location counts */
  const locationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (item.isActive && item.status === "active" && item.location) {
        counts.set(item.location, (counts.get(item.location) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([location, count]) => ({ location, count }));
  }, [items]);

  /** Total active items */
  const totalResults = results.length;

  return {
    filters,
    results,
    totalResults,
    categoryCounts,
    locationCounts,
    savedSearches,
    updateFilters,
    clearFilters,
    saveSearch,
    removeSavedSearch,
  };
}
