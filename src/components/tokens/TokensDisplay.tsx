"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { Coins, TrendingUp, TrendingDown, X } from "lucide-react";

const REASON_LABELS: Record<string, string> = {
  welcome_bonus: "Bonus de bun venit",
  signup_bonus: "Bonus înregistrare",
  add_item: "Obiect nou adăugat",
  complete_swap: "Swap finalizat",
  swap_completed: "Swap finalizat",
  review: "Review lăsat",
  daily_login: "Login zilnic",
  daily_streak: "Streak zilnic",
  boost_item: "Boost obiect",
  boost_spent: "Boost cheltuit",
  referral: "Recomandare",
  monthly_grant: "Grant lunar",
  admin_grant: "Grant admin",
  gift_sent: "Cadou trimis",
  gift_received: "Cadou primit",
  purchase: "Achiziție",
  milestone_bonus: "Bonus milestone",
  loyalty_reward: "Recompensă loialitate",
};

export function TokensDisplay() {
  const { user, tokenLedger, tokenBalance } = useAppState();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("common");

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  const balance = tokenBalance ?? user.stats.tokens ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"
        aria-label={t("tokenBalance")}
      >
        <Coins className="h-4 w-4" />
        <span>{balance}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {balance} tokens
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* How to earn */}
          <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("tokenHowToEarn")}
            </p>
            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex justify-between">
                <span>{t("tokenEarnItem")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+10</span>
              </div>
              <div className="flex justify-between">
                <span>{t("tokenEarnSwap")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+30</span>
              </div>
              <div className="flex justify-between">
                <span>{t("tokenEarnReview")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+10</span>
              </div>
              <div className="flex justify-between">
                <span>{t("tokenEarnDaily")}</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">+2–10</span>
              </div>
            </div>
          </div>

          {/* Transaction history */}
          <div className="max-h-64 overflow-y-auto px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {t("tokenHistory")}
            </p>
            {tokenLedger.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-400">{t("tokenNoHistory")}</p>
            ) : (
              <div className="space-y-2">
                {tokenLedger.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-2">
                      {entry.amount > 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                          {REASON_LABELS[entry.reason] ?? entry.reason}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {new Date(entry.createdAt).toLocaleDateString("ro-RO", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        entry.amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {entry.amount > 0 ? "+" : ""}
                      {entry.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
