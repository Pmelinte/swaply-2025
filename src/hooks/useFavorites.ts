"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { trackItemEvent } from "@/lib/item-analytics";

const LS_KEY = "swaply_favorites";

type FavoriteOperation = "add" | "remove";

function readLocalStorage(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeLocalStorage(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage can be unavailable or full; favorites still remain in memory.
  }
}

function applyFavoriteOperations(
  ids: Set<string>,
  operations: Map<string, FavoriteOperation>,
): Set<string> {
  const next = new Set(ids);

  for (const [itemId, operation] of operations) {
    if (operation === "add") next.add(itemId);
    else next.delete(itemId);
  }

  return next;
}

export function useFavorites(userId: string | null | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(readLocalStorage);
  const [loaded, setLoaded] = useState(!userId);
  const [error, setError] = useState<string | null>(null);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());
  const migratedUserRef = useRef<string | null>(null);
  const optimisticDuringLoadRef = useRef<Map<string, FavoriteOperation>>(new Map());

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      migratedUserRef.current = null;
      optimisticDuringLoadRef.current.clear();
      queueMicrotask(() => {
        if (cancelled) return;
        setFavoriteIds(readLocalStorage());
        setLoaded(true);
        setError(null);
      });
      return () => { cancelled = true; };
    }

    optimisticDuringLoadRef.current.clear();

    void (async () => {
      setLoaded(false);
      setError(null);
      const res = await fetch("/api/favorites", { credentials: "same-origin" });
      if (cancelled) return;
      if (!res.ok) {
        setError("Favorites service is unavailable");
        setLoaded(true);
        return;
      }
      const payload = (await res.json()) as { itemIds?: string[] };
      const serverIds = new Set(payload.itemIds ?? []);
      const localIds = readLocalStorage();
      const toMigrate = [...localIds].filter((id) => !serverIds.has(id));
      if (toMigrate.length > 0 && migratedUserRef.current !== userId) {
        await Promise.all(toMigrate.map((itemId) => fetch("/api/favorites", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, favorite: true }),
        })));
        toMigrate.forEach((id) => serverIds.add(id));
        migratedUserRef.current = userId;
      }
      if (localIds.size > 0) localStorage.removeItem(LS_KEY);
      setFavoriteIds(applyFavoriteOperations(serverIds, optimisticDuringLoadRef.current));
      optimisticDuringLoadRef.current.clear();
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      if (pendingItemIds.has(itemId)) return;

      const removing = favoriteIds.has(itemId);
      const operation: FavoriteOperation = removing ? "remove" : "add";

      if (!loaded) {
        optimisticDuringLoadRef.current.set(itemId, operation);
      }

      setError(null);
      setPendingItemIds((prev) => new Set(prev).add(itemId));
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (removing) next.delete(itemId);
        else next.add(itemId);
        if (!userId) writeLocalStorage(next);
        return next;
      });

      if (!userId) {
        trackItemEvent(itemId, removing ? "unfavorite" : "favorite", userId);
        setPendingItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        return;
      }

      const result = await fetch("/api/favorites", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, favorite: !removing }),
      });

      if (!result.ok) {
        optimisticDuringLoadRef.current.delete(itemId);
        setError("Favorites service is unavailable");
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (removing) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
      } else {
        trackItemEvent(itemId, removing ? "unfavorite" : "favorite", userId);
      }

      setPendingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    },
    [favoriteIds, loaded, pendingItemIds, userId],
  );

  const isFavorite = useCallback(
    (itemId: string) => favoriteIds.has(itemId),
    [favoriteIds],
  );

  const isPending = useCallback(
    (itemId: string) => pendingItemIds.has(itemId),
    [pendingItemIds],
  );

  return {
    favoriteIds,
    toggleFavorite,
    isFavorite,
    isPending,
    loaded,
    error,
  };
}
