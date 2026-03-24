"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, AlertTriangle, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";
import type { MatchExplanation, NearMatchSuggestion } from "@/lib/types";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-green-500" :
    score >= 70 ? "bg-blue-500" :
    score >= 40 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-black tabular-nums text-zinc-900 dark:text-zinc-50">
        {score}<span className="text-sm font-semibold text-zinc-400">/100</span>
      </span>
      <div className="flex-1">
        <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
        <span className="mt-0.5 block text-right text-[10px] tabular-nums text-zinc-400">
          {score}%
        </span>
      </div>
    </div>
  );
}

function SuggestionChip({
  suggestion,
  t,
  onApply,
}: {
  suggestion: NearMatchSuggestion;
  t: (key: string, values?: Record<string, string | number>) => string;
  onApply?: (suggestion: NearMatchSuggestion) => void;
}) {
  const label = suggestion.newRadiusKm
    ? t(suggestion.labelKey, { radius: suggestion.newRadiusKm })
    : t(suggestion.labelKey);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/60 px-3 py-2 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-center gap-2 min-w-0">
        <TrendingUp className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{label}</span>
        <span className="shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-300">
          +{suggestion.scoreBoost}
        </span>
      </div>
      {onApply && (
        <button
          type="button"
          onClick={() => onApply(suggestion)}
          className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-blue-700"
        >
          {t("suggApply")}
        </button>
      )}
    </div>
  );
}

export function MatchExplanationPanel({
  explanation,
  distanceKm,
  onApplySuggestion,
}: {
  explanation: MatchExplanation;
  distanceKm?: number;
  onApplySuggestion?: (suggestion: NearMatchSuggestion) => void;
}) {
  const t = useTranslations("matchExplanation");

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Score bar */}
      <ScoreBar score={explanation.score} />

      {/* Positives */}
      {explanation.positives.length > 0 && (
        <div className="space-y-1">
          {explanation.positives.map((key) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
              <span className="text-zinc-700 dark:text-zinc-300">{t(key)}</span>
            </div>
          ))}
          {distanceKm !== undefined && distanceKm <= 15 && (
            <div className="flex items-start gap-2 text-xs">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
              <span className="text-zinc-700 dark:text-zinc-300">
                {t("explDistanceDetail", { km: distanceKm })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Negatives */}
      {explanation.negatives.length > 0 && (
        <div className="space-y-1">
          {explanation.negatives.map((key) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
              <span className="text-zinc-600 dark:text-zinc-400">{t(key)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Missing — things user can improve */}
      {explanation.missing.length > 0 && (
        <div className="space-y-1 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          <p className="text-[10px] font-semibold uppercase text-zinc-400">{t("improveTips")}</p>
          {explanation.missing.map((key) => (
            <div key={key} className="flex items-start gap-2 text-xs">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500 dark:text-violet-400" />
              <span className="text-zinc-600 dark:text-zinc-400">{t(key)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Alternatives — actionable suggestions */}
      {explanation.alternatives.length > 0 && (
        <div className="space-y-1.5 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          <div className="flex items-center gap-1.5">
            <ArrowRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <p className="text-[10px] font-semibold uppercase text-blue-600 dark:text-blue-400">{t("nearMatchTitle")}</p>
          </div>
          {explanation.alternatives.map((alt) => (
            <SuggestionChip
              key={alt.type}
              suggestion={alt}
              t={t}
              onApply={onApplySuggestion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
