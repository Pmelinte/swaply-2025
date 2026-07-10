"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { InfoStats } from "@/lib/types";

const EMPTY_STATS: InfoStats = {
  globalSwaps: 0,
  activeUsers: 0,
  premiumShare: 0,
  tokensIssued: 0,
};

/**
 * Fetches real platform stats from Supabase.
 * Refreshes every 60 seconds.
 */
export function useInfoStats(): InfoStats {
  const [stats, setStats] = useState<InfoStats>(EMPTY_STATS);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let cancelled = false;

    async function fetchStats() {
      const sb = getSupabaseClient();
      if (!sb) return;

      const [swapResult, { count: userCount }, { count: premiumCount }] =
        await Promise.all([
          Promise.resolve(
            sb
              .from("swaps")
              .select("*", { count: "exact", head: true })
              .eq("status", "completed"),
          )
            .then((res) => {
              if (res.error) return { count: 0, data: null, error: res.error };
              return res;
            })
            .catch(() => ({ count: 0, data: null, error: null })),
          sb.from("public_profiles").select("*", { count: "exact", head: true }),
          sb
            .from("public_profiles")
            .select("*", { count: "exact", head: true })
            .neq("badge", "free"),
        ]);
      const swapCount = swapResult.count;

      if (cancelled) return;

      const users = userCount ?? 0;
      const premium = premiumCount ?? 0;

      setStats({
        globalSwaps: swapCount ?? 0,
        activeUsers: users,
        premiumShare: users > 0 ? premium / users : 0,
        // TODO: replace with real token ledger count when table exists
        tokensIssued: 0,
      });
    }

    fetchStats();
    const interval = setInterval(fetchStats, 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
