"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatScore } from "@/lib/utils";
import type { MatchCandidate, MatchTier } from "@/lib/types";
import { Pill } from "@/components/ui";

export function MatchList({
  matches,
  onProposeSwap,
}: {
  matches: MatchCandidate[];
  onProposeSwap?: (match: MatchCandidate) => void;
}) {
  const t = useTranslations("matchList");

  const TIER_STYLES: Record<MatchTier, { bg: string; text: string; label: string }> = {
    weak:     { bg: "bg-red-100 dark:bg-red-950/40",    text: "text-red-800 dark:text-red-200",       label: t("weak") },
    possible: { bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-800 dark:text-amber-200",   label: t("possible") },
    good:     { bg: "bg-blue-100 dark:bg-blue-950/40",   text: "text-blue-800 dark:text-blue-200",     label: t("good") },
    strong:   { bg: "bg-green-100 dark:bg-green-950/40", text: "text-green-800 dark:text-green-200",   label: t("veryGood") },
  };

  if (!matches.length) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/90 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300">
        {t("noMatches")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => {
        const tier = match.tier ?? "possible";
        const style = TIER_STYLES[tier];
        return (
          <div
            key={match.id}
            className="rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-zinc-500">{t("swapProposal")}</p>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  {match.itemOffered.title} ↔ {match.itemRequested.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${style.bg} ${style.text}`}>
                  {style.label}
                </span>
                <Pill color="blue">{formatScore(match.compatibilityScore)}</Pill>
              </div>
            </div>

            {/* Explainer reasons */}
            {(match.reasons ?? []).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {(match.reasons ?? []).slice(0, 3).map((r, i) => (
                  <span key={i} className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {r}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{match.reason}</p>
            )}

            {match.aiTrace ? (
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-200">
                {t("aiTrace")} {match.aiTrace}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <Link
                href={`/objects/${match.itemRequested.id}`}
                className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
              >
                {t("viewDetails")}
              </Link>
              <Link
                href={`/chat?to=${encodeURIComponent(match.itemRequested.ownerId)}`}
                className="rounded-full bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800"
              >
                {t("sendMessage")}
              </Link>
              {onProposeSwap ? (
                <button
                  type="button"
                  onClick={() => onProposeSwap(match)}
                  className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700"
                >
                  {t("proposeExchange")}
                </button>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
