// src/app/(app)/profile/gamification.tsx

"use client";

import { useEffect, useState } from "react";

type UserRankState = {
  userId: string;
  rank: "bronze" | "silver" | "gold" | "platinum";
  points: number;
  createdAt: string;
  updatedAt: string;
};

type UserStats = {
  userId: string;
  points: number;
  swapsCount: number;
  wishlistCount: number;
  matchesCount: number;
  trustScore: number;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse =
  | {
      ok: true;
      rank: UserRankState;
      stats: UserStats;
    }
  | { ok: false; error: string };

const RANK_ORDER: UserRankState["rank"][] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
];

const RANK_THRESHOLDS: Record<UserRankState["rank"], number> = {
  bronze: 0,
  silver: 100,
  gold: 300,
  platinum: 700,
};

function getNextRank(rank: UserRankState["rank"]) {
  const idx = RANK_ORDER.indexOf(rank);
  return idx < RANK_ORDER.length - 1 ? RANK_ORDER[idx + 1] : null;
}

export default function GamificationCard() {
  const [rank, setRank] = useState<UserRankState | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gamification/me", { cache: "no-store" });
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcare.");
        return;
      }

      setRank(data.rank);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      console.error("[GAMIFICATION_UI_LOAD_ERROR]", err);
      setError("Eroare la încărcare.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="p-4 border rounded">Se încarcă rangul…</div>;
  }

  if (error) {
    return (
      <div className="p-4 border rounded text-red-600">
        Eroare: {error}
      </div>
    );
  }

  if (!rank || !stats) {
    return null;
  }

  const nextRank = getNextRank(rank.rank);
  const currentMin = RANK_THRESHOLDS[rank.rank];
  const nextMin = nextRank ? RANK_THRESHOLDS[nextRank] : null;

  const progress =
    nextMin !== null
      ? Math.min(
          100,
          Math.round(((rank.points - currentMin) / (nextMin - currentMin)) * 100),
        )
      : 100;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600">Rang</div>
          <div className="text-xl font-bold capitalize">{rank.rank}</div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Puncte</div>
          <div className="text-xl font-bold">{rank.points}</div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{rank.rank}</span>
          <span>{nextRank ? nextRank : "maxim"}</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-600 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Swap-uri</span>
          <span className="font-semibold">{stats.swapsCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Wishlist</span>
          <span className="font-semibold">{stats.wishlistCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Match-uri</span>
          <span className="font-semibold">{stats.matchesCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Trust</span>
          <span className="font-semibold">{stats.trustScore}</span>
        </div>
      </div>
    </div>
  );
}