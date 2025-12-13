"use client";

import { useEffect, useState } from "react";
import type { UserRank, UserRankState, UserStats } from "@/features/gamification/types";

type ApiResponse =
  | {
      ok: true;
      rank: UserRankState;
      stats: UserStats;
    }
  | { ok: false; error: string };

/**
 * Hook pentru Gamification (MVP)
 *
 * Ce face:
 *  - citește rangul + punctele userului curent
 *  - citește statistici agregate (wishlist, match-uri, trust etc.)
 *  - NU are side-effects (read-only)
 *
 * Folosește endpoint:
 *  GET /api/gamification/me
 */
export function useGamification() {
  const [rank, setRank] = useState<UserRank>("bronze");
  const [points, setPoints] = useState<number>(0);
  const [stats, setStats] = useState<UserStats | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/gamification/me", {
        cache: "no-store",
      });

      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcarea gamificării.");
        return;
      }

      setRank(data.rank.rank);
      setPoints(data.rank.points);
      setStats(data.stats);
    } catch (err) {
      console.error("[USE_GAMIFICATION_ERROR]", err);
      setError("Eroare la încărcarea gamificării.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return {
    rank,
    points,
    stats,

    loading,
    error,

    reload: load,
  };
}