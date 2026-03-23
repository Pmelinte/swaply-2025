"use client";

import { useTranslations } from "next-intl";
import { Trophy, Lock, ShoppingCart } from "lucide-react";
import { Badge, Pill, SectionCard } from "@/components/ui";
import type { UserProfile, Achievement, ShopItem, TokenLedgerEntry, TokenShopItem } from "@/lib/types";

interface ReputationTabProps {
  draft: UserProfile;
  achievements: Achievement[];
  shopItems: ShopItem[];
  tokenLedger: TokenLedgerEntry[];
  purchaseShopItem: (id: TokenShopItem) => Promise<{ error?: string }>;
}

export default function ReputationTab({ draft, achievements, shopItems, tokenLedger, purchaseShopItem }: ReputationTabProps) {
  const t = useTranslations("profile");
  const tokenBalance = tokenLedger.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <SectionCard
        title={t("reputationAndTokens")}
        description={t("reputationDescription")}
        action={<Pill color="green">{draft.stats.reputation}</Pill>}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("tokens")}</p>
            <p className="text-xl font-bold">{tokenBalance}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("completedSwaps")}</p>
            <p className="text-xl font-bold">{draft.stats.completedSwaps}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("activeListings")}</p>
            <p className="text-xl font-bold">{draft.stats.activeListings}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("badge")}</p>
            <Badge tier={draft.badge} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("achievements")} description={t("achievementsDesc")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-xl border p-3 transition ${
                ach.unlockedAt
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                  : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{ach.title}</p>
                  <p className="text-[10px] text-zinc-500">{ach.description}</p>
                </div>
                {ach.unlockedAt ? (
                  <Trophy className="h-4 w-4 text-amber-500" aria-label={t("unlocked")} />
                ) : (
                  <Lock className="h-4 w-4 text-zinc-400" aria-label={t("locked")} />
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{ach.current}/{ach.target}</span>
                  <span>{ach.progress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700" role="progressbar" aria-valuenow={ach.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full transition-all ${ach.unlockedAt ? "bg-amber-400" : "bg-blue-400"}`}
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title={t("tokenShop")}
        description={t("tokenShopDesc")}
        action={<Pill color="blue">{t("balance")}: {tokenBalance}</Pill>}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => {
            const canAfford = tokenBalance >= item.cost;
            return (
              <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                    <p className="text-[10px] text-zinc-500">{item.description}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{item.cost} tokens</span>
                  <button type="button" disabled={!canAfford}
                    onClick={() => void purchaseShopItem(item.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
                    <ShoppingCart className="h-3 w-3" />{t("buy")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </>
  );
}
