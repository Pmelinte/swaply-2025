"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { MatchingMapPin } from "./MatchingMapPin";
import type { ScoredItem } from "@/hooks/useMatchingResults";
import type { SelectedProfile } from "@/lib/matching/matchingStore";

interface Props {
  scoredItems: ScoredItem[];
  selectedProfilesCount: number;
  onSelect: (profile: SelectedProfile) => void;
}

/** Deterministic pseudo-random position from an item id (no real GPS needed for demo). */
function pseudoPosition(id: string): { x: number; y: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  const x = 10 + ((Math.abs(h) % 800) / 800) * 80;
  const y = 10 + ((Math.abs(h >> 8) % 600) / 600) * 80;
  return { x, y };
}

export function MatchingMap({ scoredItems, selectedProfilesCount, onSelect }: Props) {
  const t = useTranslations("matching");

  // Show top 30 pins max
  const pins = useMemo(
    () => scoredItems.slice(0, 30).map((s) => ({
      ...s,
      pos: pseudoPosition(s.item.id),
    })),
    [scoredItems],
  );

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-bold text-zinc-900 dark:text-zinc-50">
        🗺️ {t("mapTitle")}
      </h2>

      <div className="relative h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-blue-50 to-teal-50 dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-700">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(100,116,139,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {pins.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-400">{t("noPins")}</p>
          </div>
        )}

        {pins.map(({ pos, ...scored }) => (
          <MatchingMapPin
            key={scored.item.id}
            scored={scored}
            x={pos.x}
            y={pos.y}
            onSelect={onSelect}
            selectedProfilesCount={selectedProfilesCount}
          />
        ))}
      </div>

      <p className="mt-2 text-xs text-zinc-400">{t("mapHint")}</p>
    </section>
  );
}
