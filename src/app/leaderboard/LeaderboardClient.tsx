"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import {
  Trophy,
  Medal,
  Crown,
  ArrowRightLeft,
} from "lucide-react";

type TimeRange = "all" | "month" | "week";

interface LeaderEntry {
  rank: number;
  userId: string;
  name: string;
  swaps: number;
  reputation: string;
  city?: string;
  isCurrentUser: boolean;
}

export default function LeaderboardClient() {
  const { user, swaps } = useAppState();
  const t = useTranslations("leaderboard");
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const leaderboard = useMemo<LeaderEntry[]>(() => {
    // Group swaps by user, count completed ones
    const userSwaps = new Map<string, { count: number; name: string }>();

    swaps
      .filter((s) => {
        if (s.status !== "completed") return false;
        if (timeRange === "month") {
          const d = new Date(s.createdAt || "");
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (timeRange === "week") {
          const d = new Date(s.createdAt || "");
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return d >= weekAgo;
        }
        return true;
      })
      .forEach((s) => {
        [s.requesterId, s.responderId].forEach((uid) => {
          const existing = userSwaps.get(uid);
          if (existing) {
            existing.count++;
          } else {
            userSwaps.set(uid, {
              count: 1,
              name: uid === user?.id ? (user.displayName || "You") : `Swapper ${uid.slice(0, 6)}`,
            });
          }
        });
      });

    // Ensure current user appears
    if (user && !userSwaps.has(user.id)) {
      userSwaps.set(user.id, {
        count: user.stats.completedSwaps,
        name: user.displayName || "You",
      });
    }

    // Add some mock variety if too few entries
    if (userSwaps.size < 5) {
      const names = ["EcoTrader", "SwapMaster", "GreenSwapper", "TradeKing", "SwapQueen", "BarterPro"];
      names.forEach((name, i) => {
        const id = `demo-${i}`;
        if (!userSwaps.has(id)) {
          userSwaps.set(id, { count: Math.max(1, 15 - i * 2), name });
        }
      });
    }

    return [...userSwaps.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([uid, data], idx) => ({
        rank: idx + 1,
        userId: uid,
        name: data.name,
        swaps: data.count,
        reputation: data.count >= 25 ? "ambassador" : data.count >= 10 ? "trusted" : "starter",
        isCurrentUser: uid === user?.id,
      }));
  }, [swaps, user, timeRange]);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-amber-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-zinc-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-zinc-400">#{rank}</span>;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-2 flex justify-center">
          <Trophy className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("title")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
      </div>

      {/* Time range filter */}
      <div className="flex justify-center gap-2">
        {(["all", "month", "week"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              timeRange === r
                ? "bg-amber-500 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {t(`range_${r}`)}
          </button>
        ))}
      </div>

      {/* Podium (top 3) */}
      {leaderboard.length >= 3 && (
        <div className="flex items-end justify-center gap-3">
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-lg font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              2
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{leaderboard[1].name}</p>
            <p className="text-xs text-zinc-500">{leaderboard[1].swaps} swaps</p>
            <div className="mt-2 h-16 w-20 rounded-t-lg bg-zinc-200 dark:bg-zinc-700" />
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <Crown className="mb-1 h-6 w-6 text-amber-500" />
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-xl font-bold text-amber-700 ring-2 ring-amber-400 dark:bg-amber-900/40 dark:text-amber-300">
              1
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{leaderboard[0].name}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">{leaderboard[0].swaps} swaps</p>
            <div className="mt-2 h-24 w-20 rounded-t-lg bg-amber-100 dark:bg-amber-900/30" />
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
              3
            </div>
            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{leaderboard[2].name}</p>
            <p className="text-xs text-zinc-500">{leaderboard[2].swaps} swaps</p>
            <div className="mt-2 h-12 w-20 rounded-t-lg bg-amber-50 dark:bg-amber-950/30" />
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 rounded-xl border p-3 transition ${
              entry.isCurrentUser
                ? "border-blue-300 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-950/20"
                : "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center">
              {rankIcon(entry.rank)}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${entry.isCurrentUser ? "text-blue-700 dark:text-blue-300" : "text-zinc-900 dark:text-zinc-100"}`}>
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="ml-1.5 text-[10px] font-normal text-blue-500">({t("you")})</span>
                )}
              </p>
              <p className="text-xs capitalize text-zinc-500">
                {entry.reputation}
              </p>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-zinc-700 dark:text-zinc-300">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              {entry.swaps}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
