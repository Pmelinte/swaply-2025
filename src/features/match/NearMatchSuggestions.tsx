"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, Zap, Package, Truck, MapPin } from "lucide-react";
import type { MatchCandidate, NearMatchSuggestion, NearMatchSuggestionType } from "@/lib/types";

const SUGGESTION_ICONS: Record<NearMatchSuggestionType, typeof Zap> = {
  add_bundle_item: Package,
  accept_courier: Truck,
  extend_radius: MapPin,
  add_photos: Zap,
  complete_description: Zap,
  lower_value: Zap,
  accept_flexible: Zap,
};

interface AggregatedSuggestion {
  type: NearMatchSuggestionType;
  labelKey: string;
  avgScoreBoost: number;
  affectedMatchCount: number;
  newRadiusKm?: number;
}

export function NearMatchSuggestions({
  matches,
  onApply,
}: {
  matches: MatchCandidate[];
  onApply?: (suggestion: NearMatchSuggestion) => void;
}) {
  const t = useTranslations("matchExplanation");

  // Aggregate suggestions from all matches
  const aggregated = useMemo(() => {
    const map = new Map<NearMatchSuggestionType, { totalBoost: number; count: number; labelKey: string; maxRadius?: number }>();

    for (const match of matches) {
      const alts = match.matchExplanation?.alternatives ?? [];
      for (const alt of alts) {
        const existing = map.get(alt.type);
        if (existing) {
          existing.totalBoost += alt.scoreBoost;
          existing.count += 1;
          if (alt.newRadiusKm && (!existing.maxRadius || alt.newRadiusKm > existing.maxRadius)) {
            existing.maxRadius = alt.newRadiusKm;
          }
        } else {
          map.set(alt.type, {
            totalBoost: alt.scoreBoost,
            count: 1,
            labelKey: alt.labelKey,
            maxRadius: alt.newRadiusKm,
          });
        }
      }
    }

    const result: AggregatedSuggestion[] = [];
    for (const [type, data] of map) {
      if (data.count >= 1) {
        result.push({
          type,
          labelKey: data.labelKey,
          avgScoreBoost: Math.round(data.totalBoost / data.count),
          affectedMatchCount: data.count,
          newRadiusKm: data.maxRadius,
        });
      }
    }

    return result.sort((a, b) => b.affectedMatchCount - a.affectedMatchCount);
  }, [matches]);

  if (aggregated.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{t("nearMatchSectionTitle")}</p>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("nearMatchSectionDesc")}</p>

      <div className="space-y-2">
        {aggregated.map((sugg) => {
          const Icon = SUGGESTION_ICONS[sugg.type];
          const label = sugg.newRadiusKm
            ? t(sugg.labelKey, { radius: sugg.newRadiusKm })
            : t(sugg.labelKey);

          return (
            <div
              key={sugg.type}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-700"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{label}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {t("suggAffects", { count: sugg.affectedMatchCount })} · +{sugg.avgScoreBoost} {t("suggAvgPoints")}
                  </p>
                </div>
              </div>
              {onApply && (
                <button
                  type="button"
                  onClick={() =>
                    onApply({
                      type: sugg.type,
                      labelKey: sugg.labelKey,
                      scoreBoost: sugg.avgScoreBoost,
                      newRadiusKm: sugg.newRadiusKm,
                      newMatchesCount: sugg.affectedMatchCount,
                    })
                  }
                  className="shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  {t("suggApply")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
