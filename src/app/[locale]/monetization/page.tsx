"use client";

import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { SectionCard } from "@/components/ui";
import { MonetizationHub } from "@/features/monetization/MonetizationHub";
import { Crown, Zap, Star } from "lucide-react";
import { useTranslations } from "next-intl";

export default function MonetizationPage() {
  const { user } = useAppState();
  const t = useTranslations("monetization");

  if (!user) {
    return (
      <div className="space-y-6">
        <SectionCard title={t("guestTitle")} description={t("guestDescription")}>
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              {t("guestIntro")}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
                <Zap className="mb-2 h-6 w-6 text-zinc-400" />
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{t("free")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("planFreeDesc")}</p>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("priceFree")} {t("currency")}<span className="text-xs font-normal text-zinc-400">{t("perMonthShort")}</span></p>
              </div>
              <div className="rounded-xl border-2 border-blue-500 bg-blue-50/50 p-5 dark:bg-blue-900/20">
                <Crown className="mb-2 h-6 w-6 text-blue-500" />
                <h4 className="font-bold text-blue-700 dark:text-blue-300">{t("planPremium")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("planPremiumDesc")}</p>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("pricePremium")} {t("currency")}<span className="text-xs font-normal text-zinc-400">{t("perMonthShort")}</span></p>
              </div>
              <div className="rounded-xl border border-amber-300 bg-amber-50/50 p-5 dark:border-amber-700 dark:bg-amber-900/20">
                <Star className="mb-2 h-6 w-6 text-amber-500" />
                <h4 className="font-bold text-amber-700 dark:text-amber-300">{t("planPlatinum")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("planPlatinumDesc")}</p>
                <p className="mt-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("pricePlatinum")} {t("currency")}<span className="text-xs font-normal text-zinc-400">{t("perMonthShort")}</span></p>
              </div>
            </div>
          </div>
        </SectionCard>
        <LoggedOutGate returnTo="/monetization" />
      </div>
    );
  }

  return <MonetizationHub />;
}
