"use client";

import { useTranslations } from "next-intl";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import { MatchingScoreBreakdown } from "./MatchingScoreBreakdown";
import type { ScoredItem } from "@/hooks/useMatchingResults";
import type { SelectedProfile } from "@/lib/matching/matchingStore";
import { useAppState } from "@/lib/state";

interface Props {
  scored: ScoredItem | null;
  onClose: () => void;
  onExpressInterest: (profile: SelectedProfile) => void;
  onIgnore: () => void;
  profilesCount: number;
}

export function MatchingItemModal({
  scored,
  onClose,
  onExpressInterest,
  onIgnore,
  profilesCount,
}: Props) {
  const t = useTranslations("matching");
  const tc = useTranslations("common");
  const { user } = useAppState();
  const [photoIdx, setPhotoIdx] = useState(0);

  if (!scored) return null;
  const { item, score } = scored;
  const photos = item.photos ?? [];

  const scoreColor =
    score >= 75
      ? "text-green-600 dark:text-green-400"
      : score >= 50
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-zinc-500 dark:text-zinc-400";

  function handleInterest() {
    if (!user) return;
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
      source: "browsing",
    };
    onExpressInterest(profile);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white dark:bg-zinc-900 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{t("itemDetails")}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Photo gallery */}
          {photos.length > 0 && (
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Image
                src={photos[photoIdx]}
                alt={item.title}
                fill
                className="object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPhotoIdx((i: number) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow dark:bg-black/60"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoIdx((i: number) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 shadow dark:bg-black/60"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {photos.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${i === photoIdx ? "bg-white" : "bg-white/50"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Title + score */}
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{item.title}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-zinc-500">{item.category}</span>
              <span className="text-zinc-300">·</span>
              <span className={`text-sm font-semibold ${scoreColor}`}>
                {t("score")}: {score}%
              </span>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("description")}</p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{item.description}</p>
            </div>
          )}

          {/* What they want */}
          {item.wishlist && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{t("theyWant")}</p>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{item.wishlist}</p>
            </div>
          )}

          {/* Score breakdown */}
          <MatchingScoreBreakdown scored={scored} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => { onIgnore(); onClose(); }}
            className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {t("ignore")}
          </button>
          <button
            type="button"
            onClick={handleInterest}
            disabled={profilesCount >= 2}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("expressInterest")} →
          </button>
        </div>
      </div>
    </div>
  );
}
