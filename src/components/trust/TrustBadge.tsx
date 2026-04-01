"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { TrustResult } from "@/lib/utils/trustScore";
import { TIER_CONFIG } from "@/lib/utils/trustScore";
import { Shield } from "lucide-react";

/**
 * Compact trust score badge for match cards.
 * Shows score/100 + tier label, with popover breakdown on hover/click.
 * Uses the Popover API (popover="auto") for native top-layer rendering.
 */
export function TrustBadge({ result }: { result: TrustResult }) {
  const t = useTranslations("trustScore");
  const popoverId = useId();
  const config = TIER_CONFIG[result.tier];

  const positiveSignals = result.signals.filter((s) => s.positive && s.points > 0);
  const negativeSignals = result.signals.filter((s) => !s.positive);

  return (
    <div className="relative inline-flex">
      {/* Trigger button — toggles the popover via popovertarget */}
      <button
        type="button"
        /* @ts-expect-error -- popovertarget is valid HTML but not yet in React types */
        popovertarget={popoverId}
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${config.bg} ${config.text} ${config.border} border`}
      >
        <Shield className="h-3.5 w-3.5" />
        {result.score}/100
        <span className="hidden sm:inline">{config.emoji} {t(`tier_${result.tier}`)}</span>
      </button>

      {/* Popover content — rendered in top layer by the browser */}
      <div
        id={popoverId}
        popover="auto"
        className="m-0 w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
      >
        <p className="mb-2 text-xs font-bold text-zinc-800 dark:text-zinc-100">
          {t("trustScoreTitle")}
        </p>
        {positiveSignals.length > 0 && (
          <div className="space-y-1">
            {positiveSignals.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-green-600 dark:text-green-400">&#10003;</span>
                <span className="flex-1 text-zinc-700 dark:text-zinc-300">{t(`signal_${s.key}`)}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">+{s.points}</span>
              </div>
            ))}
          </div>
        )}
        {negativeSignals.length > 0 && (
          <div className="mt-1.5 space-y-1 border-t border-zinc-100 pt-1.5 dark:border-zinc-800">
            {negativeSignals.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-red-500">&#9888;</span>
                <span className="flex-1 text-zinc-700 dark:text-zinc-300">{t(`signal_${s.key}`)}</span>
                <span className="font-semibold text-red-500">{s.points}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
          <span className={`text-xs font-bold ${config.text}`}>
            {config.emoji} {t(`tier_${result.tier}`)}
          </span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{result.score}/100</span>
        </div>
      </div>
    </div>
  );
}
