"use client";

import { useTranslations } from "next-intl";
import type { TrustResult } from "@/lib/utils/trustScore";
import { TIER_CONFIG } from "@/lib/utils/trustScore";
import { Shield } from "lucide-react";

/**
 * Full trust breakdown card for the swap/change page.
 * Shows all positive/negative signals with a progress bar.
 */
export function TrustCard({
  result,
  participantLabel,
}: {
  result: TrustResult;
  participantLabel: string;
}) {
  const t = useTranslations("trustScore");
  const config = TIER_CONFIG[result.tier];

  const positiveSignals = result.signals.filter((s) => s.positive);
  const negativeSignals = result.signals.filter((s) => !s.positive);

  return (
    <div className={`rounded-2xl border ${config.border} ${config.bg} p-4`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className={`h-5 w-5 ${config.text}`} />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {t("swapTrustTitle")}
          </h3>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}>
          {result.score}/100 {config.emoji} {t(`tier_${result.tier}`)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={`h-full rounded-full transition-all ${config.progressColor}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Participant */}
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        {t("forParticipant", { name: participantLabel })}
      </p>

      {/* Signals breakdown */}
      <div className="mt-3 space-y-1.5">
        {positiveSignals.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs">
            <span className={`shrink-0 ${s.points > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"}`}>
              {s.points > 0 ? "✓" : "○"}
            </span>
            <span className={`flex-1 ${s.points > 0 ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"}`}>
              {t(`signal_${s.key}`)}
            </span>
            <span className={`font-semibold ${s.points > 0 ? "text-green-600 dark:text-green-400" : "text-zinc-400 dark:text-zinc-500"}`}>
              {s.points > 0 ? `+${s.points}` : `0/${s.maxPoints}`}
            </span>
          </div>
        ))}

        {negativeSignals.length > 0 && (
          <div className="border-t border-zinc-200 pt-1.5 dark:border-zinc-700">
            {negativeSignals.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-xs">
                <span className="shrink-0 text-red-500">⚠</span>
                <span className="flex-1 text-red-700 dark:text-red-300">{t(`signal_${s.key}`)}</span>
                <span className="font-semibold text-red-500">{s.points}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
