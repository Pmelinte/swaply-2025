"use client";

import { useTranslations } from "next-intl";
import { InfoStats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: InfoStats }) {
  const t = useTranslations("statsGrid");

  const cards = [
    {
      label: t("globalExchanges"),
      value: stats.globalSwaps.toLocaleString("ro-RO"),
      hint: t("globalDescription"),
    },
    {
      label: t("activeUsers"),
      value: stats.activeUsers.toLocaleString("ro-RO"),
      hint: t("activeUsersDescription"),
    },
    {
      label: t("premiumPercentage"),
      value: `${Math.round(stats.premiumShare * 100)}%`,
      hint: t("premiumDescription"),
    },
    {
      label: t("tokensIssued"),
      value: stats.tokensIssued.toLocaleString("ro-RO"),
      hint: t("tokensDescription"),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <p className="text-xs uppercase text-zinc-500">{card.label}</p>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {card.value}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
