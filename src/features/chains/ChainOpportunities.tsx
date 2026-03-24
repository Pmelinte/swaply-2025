"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Link2, Loader2, RefreshCw, Zap } from "lucide-react";
import type { DetectedChainOpportunity } from "@/lib/state/useSwapChains";

export function ChainOpportunities({
  opportunities,
  detecting,
  onDetect,
  onCreateFromOpportunity,
}: {
  opportunities: DetectedChainOpportunity[];
  detecting: boolean;
  onDetect: () => void;
  onCreateFromOpportunity: (opportunity: DetectedChainOpportunity) => void;
}) {
  const t = useTranslations("chains");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
            {t("opportunitiesTitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={onDetect}
          disabled={detecting}
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 disabled:opacity-50 dark:bg-violet-900/40 dark:text-violet-300"
        >
          {detecting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {detecting ? t("detecting") : t("detectBtn")}
        </button>
      </div>

      {opportunities.length === 0 && !detecting && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <Link2 className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noOpportunities")}</p>
          <p className="mt-1 text-xs text-zinc-400">{t("noOpportunitiesHint")}</p>
        </div>
      )}

      {opportunities.map((opp, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm dark:border-violet-800 dark:from-violet-950/20 dark:to-zinc-900"
        >
          {/* Score badge */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold uppercase text-violet-600 dark:text-violet-400">
                {t("chainOpportunity")} #{idx + 1}
              </span>
            </div>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
              {opp.score}/100
            </span>
          </div>

          {/* Chain flow */}
          <div className="space-y-2">
            {opp.participants.map((p, pIdx) => (
              <div key={pIdx} className="flex items-center gap-2 text-sm">
                <span className="shrink-0 font-semibold text-zinc-800 dark:text-zinc-200">
                  {p.userName}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="truncate rounded-md bg-white px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700">
                  {p.givesItemTitle}
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="shrink-0 font-semibold text-zinc-800 dark:text-zinc-200">
                  {opp.participants[(pIdx + 1) % opp.participants.length].userName}
                </span>
              </div>
            ))}
          </div>

          {/* Complete chain indicator */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              {t("chainCompleteIndicator")}
            </span>
            <button
              type="button"
              onClick={() => onCreateFromOpportunity(opp)}
              className="rounded-full bg-violet-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-violet-700"
            >
              {t("proposeChain")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
