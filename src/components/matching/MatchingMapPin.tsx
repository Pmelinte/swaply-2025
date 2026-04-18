"use client";

import { useState } from "react";
import type { ScoredItem } from "@/hooks/useMatchingResults";
import type { SelectedProfile } from "@/lib/matching/matchingStore";
import { useTranslations } from "next-intl";

interface Props {
  scored: ScoredItem;
  x: number; // percent 0-100 from left
  y: number; // percent 0-100 from top
  onSelect: (profile: SelectedProfile) => void;
  selectedProfilesCount: number;
}

function pinColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-400";
  return "bg-zinc-400";
}

export function MatchingMapPin({ scored, x, y, onSelect, selectedProfilesCount }: Props) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState<boolean>(false);
  const t = useTranslations("matching");

  const { item, score } = scored;

  function handleSelect() {
    if (selectedProfilesCount >= 2) return;
    const profile: SelectedProfile = {
      userId: item.ownerId,
      profile: {
        id: item.ownerId,
        email: "",
        displayName: item.ownerId,
        languages: [],
        badge: "free",
        visibility: { publicProfile: true, itemsVisibility: "public", showExactLocation: false, showLastSeen: false },
        notifications: { email: true, push: false, chat: true, matches: true, swapUpdates: true },
        swapPreferences: { logistics: "flexible" },
        security: { twoFactorEnabled: false, method: null, passkeysEnabled: false },
        stats: { tokens: 0, reputation: "starter", completedSwaps: 0, activeListings: 1 },
      },
      item,
      matchScore: score,
      source: "map",
    };
    onSelect(profile);
    setExpanded(false);
  }

  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Pin dot */}
      <button
        type="button"
        onClick={() => setExpanded((v: boolean) => !v)}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg transition hover:scale-110 ${pinColor(score)} ${score < 40 ? "opacity-50" : ""}`}
      >
        {score}
      </button>

      {/* Hover tooltip */}
      {hovered && !expanded && (
        <div className="absolute bottom-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-zinc-700">
          {score}% · {item.title}
        </div>
      )}

      {/* Expanded mini-card */}
      {expanded && (
        <div className="absolute bottom-10 left-1/2 z-20 -translate-x-1/2 w-48 rounded-xl bg-white p-2 shadow-xl dark:bg-zinc-800">
          <p className="line-clamp-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
            {item.title}
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-400">{item.category}</p>
          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
            {score}% match
          </p>
          <button
            type="button"
            onClick={handleSelect}
            disabled={selectedProfilesCount >= 2}
            className="mt-1.5 w-full rounded-lg bg-blue-600 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t("select")}
          </button>
        </div>
      )}
    </div>
  );
}
