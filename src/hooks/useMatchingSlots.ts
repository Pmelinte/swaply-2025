"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "swaply_slots";

function readStored(): [string | null, string | null] {
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

function writeStored(ids: [string | null, string | null]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function useMatchingSlots(
  initialSlot1: string | null = null,
  initialSlot2: string | null = null,
) {
  const [slot1Id, setSlot1Id] = useState<string | null>(null);
  const [slot2Id, setSlot2Id] = useState<string | null>(null);

  useEffect(() => {
    const [s1, s2] = readStored();
    const next1 = initialSlot1 ?? s1;
    const next2 = initialSlot2 ?? s2;
    setSlot1Id(next1);
    setSlot2Id(next2);
    if (next1 !== s1 || next2 !== s2) {
      writeStored([next1, next2]);
    }
    // Initial URL params override only on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSlot1 = useCallback((id: string | null) => {
    setSlot1Id(id);
    setSlot2Id((curr) => {
      writeStored([id, curr]);
      return curr;
    });
  }, []);

  const setSlot2 = useCallback((id: string | null) => {
    setSlot2Id(id);
    setSlot1Id((curr) => {
      writeStored([curr, id]);
      return curr;
    });
  }, []);

  const clearSlot1 = useCallback(() => setSlot1(null), [setSlot1]);
  const clearSlot2 = useCallback(() => setSlot2(null), [setSlot2]);

  return { slot1Id, slot2Id, setSlot1, setSlot2, clearSlot1, clearSlot2 };
}
