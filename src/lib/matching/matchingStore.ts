"use client";

/**
 * Client-side state for the Matching page.
 * Stores the 2 active slots and up to 2 selected profiles.
 * Slots are persisted in localStorage for cross-session continuity.
 */

import { useState, useCallback, useEffect } from "react";
import type { Item, UserProfile } from "../types";

const STORAGE_KEY = "swaply_matching_slots";

export interface SelectedProfile {
  userId: string;
  profile: UserProfile;
  item: Item;
  matchScore: number;
  source: "browsing" | "map" | "ai";
}

export interface MatchingState {
  slots: [Item | null, Item | null];
  selectedProfiles: SelectedProfile[];
}

function loadSlotIds(): [string | null, string | null] {
  if (typeof window === "undefined") return [null, null];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [null, null];
    const parsed = JSON.parse(raw);
    return [parsed[0] ?? null, parsed[1] ?? null];
  } catch {
    return [null, null];
  }
}

function saveSlotIds(ids: [string | null, string | null]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function useMatchingStore(allItems: Item[]) {
  const [slots, setSlots] = useState<[Item | null, Item | null]>([null, null]);
  const [selectedProfiles, setSelectedProfiles] = useState<SelectedProfile[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate slots from localStorage on mount
  useEffect(() => {
    const [id1, id2] = loadSlotIds();
    setSlots([
      id1 ? (allItems.find((i) => i.id === id1) ?? null) : null,
      id2 ? (allItems.find((i) => i.id === id2) ?? null) : null,
    ]);
    setHydrated(true);
  }, [allItems]);

  const addSlot = useCallback((item: Item) => {
    setSlots((prev) => {
      const next: [Item | null, Item | null] = [...prev] as [Item | null, Item | null];
      const emptyIdx = next.findIndex((s) => s === null);
      if (emptyIdx === -1) return prev; // both full
      next[emptyIdx] = item;
      saveSlotIds([next[0]?.id ?? null, next[1]?.id ?? null]);
      return next;
    });
  }, []);

  const removeSlot = useCallback((itemId: string) => {
    setSlots((prev) => {
      const next: [Item | null, Item | null] = prev.map((s) =>
        s?.id === itemId ? null : s,
      ) as [Item | null, Item | null];
      saveSlotIds([next[0]?.id ?? null, next[1]?.id ?? null]);
      return next;
    });
  }, []);

  const clearSlots = useCallback(() => {
    setSlots([null, null]);
    saveSlotIds([null, null]);
  }, []);

  const addSelectedProfile = useCallback((profile: SelectedProfile) => {
    setSelectedProfiles((prev) => {
      if (prev.length >= 2) return prev;
      if (prev.some((p) => p.userId === profile.userId)) return prev;
      return [...prev, profile];
    });
  }, []);

  const removeSelectedProfile = useCallback((userId: string) => {
    setSelectedProfiles((prev) => prev.filter((p) => p.userId !== userId));
  }, []);

  const slotsAreFull = slots[0] !== null && slots[1] !== null;
  const hasAnySlot = slots[0] !== null || slots[1] !== null;
  const activeSlots = slots.filter(Boolean) as Item[];

  return {
    slots,
    selectedProfiles,
    hydrated,
    slotsAreFull,
    hasAnySlot,
    activeSlots,
    addSlot,
    removeSlot,
    clearSlots,
    addSelectedProfile,
    removeSelectedProfile,
  };
}
