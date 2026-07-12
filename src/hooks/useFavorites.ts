"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { trackItemEvent } from "@/lib/item-analytics";

const LS_KEY = "swaply_favorites";

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

export function useFavorites(userId: string | null | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(readLocalStorage);
  const [loaded, setLoaded] = useState(!userId || !getSupabaseClient());
  const [error, setError] = useState<string | null>(null);
  const [pendingItemIds, setPendingItemIds] = useState<Set<string>>(new Set());
  const migratedUserRef = useRef<string | null>(null);

  useEffect(() => {
    const sb = getSupabaseClient();

    if (!userId || !sb) {
      migratedUserRef.current = null;
      setFavoriteIds(readLocalStorage());
      setLoaded(true);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    setError(null);

    void (async () => {
      const { data, error: fetchError } = await sb
        .from("user_favorites")
        .select("item_id")
        .eq("user_id", userId);

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
        setLoaded(true);
        return;
      }

      const serverIds = new Set<string>(
        (data ?? []).map((row: { item_id: string }) => row.item_id),
      );
      const localIds = readLocalStorage();
      const toMigrate = [...localIds].filter((id) => !serverIds.has(id));

      if (toMigrate.length > 0 && migratedUserRef.current !== userId) {
        const rows = toMigrate.map((item_id) => ({ user_id: userId, item_id }));
        const { error: migrationError } = await sb
          .from("user_favorites")
          .upsert(rows, { onConflict: "user_id,item_id" });

        if (cancelled) return;
        if (migrationError) {
          setError(migrationError.message);
          setFavoriteIds(new Set([...serverIds, ...localIds]));
          setLoaded(true);
          return;
        }

        toMigrate.forEach((id) => serverIds.add(id));
        migratedUserRef.current = userId;
      }

      if (localIds.size > 0) localStorage.removeItem(LS_KEY);
      setFavoriteIds(serverIds);
      setLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      if (pendingItemIds.has(itemId)) return;

      const removing = favoriteIds.has(itemId);
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

      const sb = getSupabaseClient();
      if (!sb) {
        setError("Favorites service is unavailable");
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (removing) next.add(itemId);
          else next.delete(itemId);
          return next;
        });
        setPendingItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        return;
      }

      const result = removing
        ? await sb
            .from("user_favorites")
            .delete()
            .eq("user_id", userId)
            .eq("item_id", itemId)
        : await sb
            .from("user_favorites")
            .upsert(
              { user_id: userId, item_id: itemId },
              { onConflict: "user_id,item_id" },
            );

      if (result.error) {
        setError(result.error.message);
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
    [favoriteIds, pendingItemIds, userId],
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
