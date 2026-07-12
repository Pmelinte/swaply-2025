"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import { NO_IMAGE_URL } from "@/lib/storage";
import type { SelectedMatch } from "@/lib/matching/matchingStore";

interface Props {
  selected: SelectedMatch[];
  withdrawingIds: Set<string>;
  onWithdraw: (itemId: string) => void;
}

export default function MatchingSelected({ selected, withdrawingIds, onWithdraw }: Props) {
  const t = useTranslations("matching");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
        {t("selected_title", { count: selected.length })}
      </h2>

      {selected.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("selected_empty")}</p>
      ) : (
        <div className="space-y-3">
          {selected.map((interest) => {
            const isWithdrawing = withdrawingIds.has(interest.itemId);

            return (
              <div
                key={interest.itemId}
                data-testid={`express-interest-${interest.itemId}`}
                className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/60"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                  <SafeImage
                    src={interest.item.photos?.[0] || NO_IMAGE_URL}
                    alt={interest.item.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized={!interest.item.photos?.[0]}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {interest.item.title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {interest.score}% · {interest.matchId ? "saved" : "saving"}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <div
                    className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    aria-label={t("express_interest")}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{t("express_interest")}</span>
                  </div>

                  <button
                    type="button"
                    data-testid={`withdraw-interest-${interest.itemId}`}
                    disabled={isWithdrawing}
                    onClick={() => onWithdraw(interest.itemId)}
                    className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    aria-label="Withdraw interest"
                  >
                    {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
