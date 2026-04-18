"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { countExploreResults } from "@/lib/explore/exploreQuery";
import type { ExploreFilterState } from "@/lib/explore/exploreFilterTypes";

const DEBOUNCE_MS = 500;

export function useExploreCount(state: ExploreFilterState, enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);

    const handle = setTimeout(async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        if (!cancelled) {
          setCount(0);
          setLoading(false);
        }
        return;
      }
      try {
        const n = await countExploreResults(supabase, state);
        if (!cancelled) setCount(n);
      } catch (e) {
        console.error("[explore] count failed:", e);
        if (!cancelled) setCount(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [state, enabled]);

  return { count, loading };
}
