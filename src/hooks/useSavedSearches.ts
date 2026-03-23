"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";

export interface SavedSearchFilters {
  category?: string | null;
  city?: string | null;
  keywords?: string | null;
  listingType?: string | null;
  condition?: string | null;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: SavedSearchFilters;
  alert_enabled: boolean;
  last_checked_at: string;
  created_at: string;
  new_count?: number;
}

export interface SavedSearchNotification {
  id: string;
  saved_search_id: string;
  item_id: string;
  seen: boolean;
  created_at: string;
}

export function useSavedSearches(userId: string | undefined) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!userId || fetchedRef.current) return;
    fetchedRef.current = true;
    let cancelled = false;

    (async () => {
      const sb = getSupabaseClient();
      if (!sb) return;

      setLoading(true);
      const { data } = await sb
        .from("saved_searches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (data) {
        const { data: counts } = await sb
          .from("saved_search_notifications")
          .select("saved_search_id")
          .eq("seen", false)
          .in("saved_search_id", data.map((s) => s.id));

        if (cancelled) return;

        const countMap = new Map<string, number>();
        counts?.forEach((n) => {
          countMap.set(n.saved_search_id, (countMap.get(n.saved_search_id) ?? 0) + 1);
        });

        setSearches(
          data.map((s) => ({ ...s, new_count: countMap.get(s.id) ?? 0 }))
        );
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const createSearch = useCallback(
    async (name: string, filters: SavedSearchFilters) => {
      if (!userId) return null;
      const sb = getSupabaseClient();
      if (!sb) return null;

      const { data, error } = await sb
        .from("saved_searches")
        .insert({ user_id: userId, name, filters })
        .select()
        .single();

      if (error || !data) return null;
      setSearches((prev) => [{ ...data, new_count: 0 }, ...prev]);
      return data;
    },
    [userId],
  );

  const deleteSearch = useCallback(
    async (searchId: string) => {
      const sb = getSupabaseClient();
      if (!sb) return;

      await sb.from("saved_searches").delete().eq("id", searchId);
      setSearches((prev) => prev.filter((s) => s.id !== searchId));
    },
    [],
  );

  const toggleAlert = useCallback(
    async (searchId: string, enabled: boolean) => {
      const sb = getSupabaseClient();
      if (!sb) return;

      await sb
        .from("saved_searches")
        .update({ alert_enabled: enabled })
        .eq("id", searchId);
      setSearches((prev) =>
        prev.map((s) =>
          s.id === searchId ? { ...s, alert_enabled: enabled } : s,
        ),
      );
    },
    [],
  );

  const markNotificationsSeen = useCallback(
    async (searchId: string) => {
      const sb = getSupabaseClient();
      if (!sb) return;

      await sb
        .from("saved_search_notifications")
        .update({ seen: true })
        .eq("saved_search_id", searchId)
        .eq("seen", false);

      setSearches((prev) =>
        prev.map((s) =>
          s.id === searchId ? { ...s, new_count: 0 } : s,
        ),
      );
    },
    [],
  );

  const refetch = useCallback(async () => {
    if (!userId) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    setLoading(true);
    const { data } = await sb
      .from("saved_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      const { data: counts } = await sb
        .from("saved_search_notifications")
        .select("saved_search_id")
        .eq("seen", false)
        .in("saved_search_id", data.map((s) => s.id));

      const countMap = new Map<string, number>();
      counts?.forEach((n) => {
        countMap.set(n.saved_search_id, (countMap.get(n.saved_search_id) ?? 0) + 1);
      });

      setSearches(
        data.map((s) => ({ ...s, new_count: countMap.get(s.id) ?? 0 }))
      );
    }
    setLoading(false);
  }, [userId]);

  const totalNewCount = searches.reduce((sum, s) => sum + (s.new_count ?? 0), 0);

  return {
    searches,
    loading,
    totalNewCount,
    createSearch,
    deleteSearch,
    toggleAlert,
    markNotificationsSeen,
    refetch,
  };
}
