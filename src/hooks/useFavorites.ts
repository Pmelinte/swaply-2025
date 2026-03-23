"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

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
  } catch { /* quota exceeded — silently ignore */ }
}

/**
 * Manages user favorites with Supabase persistence and localStorage fallback.
 * - Logged-in users: read/write from Supabase `user_favorites`, migrate localStorage on login.
 * - Guests: localStorage only, migrated on next login.
 */
export function useFavorites(userId: string | null | undefined) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(readLocalStorage);
  const needsFetch = !!userId && !!getSupabaseClient();
  const [loaded, setLoaded] = useState(!needsFetch);
  const migratedRef = useRef(false);

  // --- Hydrate from Supabase when user is logged in ---
  useEffect(() => {
    if (!userId) return;

    const sb = getSupabaseClient();
    if (!sb) return;

    let cancelled = false;

    (async () => {
      // Fetch server favorites
      const { data, error } = await sb
        .from("user_favorites")
        .select("item_id")
        .eq("user_id", userId);

      if (cancelled) return;

      const serverIds = new Set<string>(
        error ? [] : (data ?? []).map((r: { item_id: string }) => r.item_id),
      );

      // Migrate localStorage → Supabase (once per session)
      const localIds = readLocalStorage();
      const toMigrate = [...localIds].filter((id) => !serverIds.has(id));

      if (toMigrate.length > 0 && !migratedRef.current) {
        migratedRef.current = true;
        const rows = toMigrate.map((item_id) => ({ user_id: userId, item_id }));
        await sb.from("user_favorites").upsert(rows, { onConflict: "user_id,item_id" });
        toMigrate.forEach((id) => serverIds.add(id));
      }

      // Clear localStorage after migration
      if (localIds.size > 0) {
        localStorage.removeItem(LS_KEY);
      }

      if (!cancelled) {
        setFavoriteIds(serverIds);
        setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // --- Toggle favorite ---
  const toggleFavorite = useCallback(
    async (itemId: string) => {
      const removing = favoriteIds.has(itemId);

      // Optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (removing) next.delete(itemId); else next.add(itemId);

        // Guest fallback: persist to localStorage
        if (!userId) writeLocalStorage(next);

        return next;
      });

      if (!userId) return; // guest — done

      const sb = getSupabaseClient();
      if (!sb) return;

      if (removing) {
        const { error } = await sb
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("item_id", itemId);

        if (error) {
          // Rollback
          setFavoriteIds((prev) => { const n = new Set(prev); n.add(itemId); return n; });
        }
      } else {
        const { error } = await sb
          .from("user_favorites")
          .upsert({ user_id: userId, item_id: itemId }, { onConflict: "user_id,item_id" });

        if (error) {
          // Rollback
          setFavoriteIds((prev) => { const n = new Set(prev); n.delete(itemId); return n; });
        }
      }
    },
    [favoriteIds, userId],
  );

  // --- Helpers ---
  const isFavorite = useCallback(
    (itemId: string) => favoriteIds.has(itemId),
    [favoriteIds],
  );

  return { favoriteIds, toggleFavorite, isFavorite, loaded };
}
