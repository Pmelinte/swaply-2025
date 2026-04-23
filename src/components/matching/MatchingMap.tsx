"use client";

import { useMemo, useState, useEffect } from "react";
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
  const [userPos, setUserPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Romania center fallback
      setUserPos({ x: 50, y: 50 });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        // Map Romania bounding box (lat 43.5–48.5, lon 20.0–30.0) to 10–90% pseudo coords
        const x = Math.min(90, Math.max(10, ((coords.longitude - 20.0) / 10.0) * 80 + 10));
        const y = Math.min(90, Math.max(10, ((48.5 - coords.latitude) / 5.0) * 80 + 10));
        setUserPos({ x, y });
      },
      () => setUserPos({ x: 50, y: 50 }),
    );
  }, []);

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
          <div className="flex h-full flex-col items-center justify-center gap-2">
            {/* Romania outline placeholder when no items */}
            <span className="text-3xl opacity-30">🗺️</span>
            <p className="text-sm text-zinc-400">{t("noPins")}</p>
          </div>
        )}

        {userPos && (
          <div
            className="absolute z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-md"
            style={{ left: `${userPos.x}%`, top: `${userPos.y}%` }}
            title={t("youAreHere")}
          />
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
