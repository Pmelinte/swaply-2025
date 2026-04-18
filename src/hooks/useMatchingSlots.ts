"use client";

import { useMatchingStore } from "@/lib/matching/matchingStore";
import { useAppState } from "@/lib/state";

/**
 * Provides slot management for the Matching page.
 * Wraps useMatchingStore with the full items list from AppState.
 */
export function useMatchingSlots() {
  const { items } = useAppState();
  return useMatchingStore(items);
}
