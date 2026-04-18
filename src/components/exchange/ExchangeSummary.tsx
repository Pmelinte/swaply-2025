"use client";

import { useTranslations } from "next-intl";
import type { ExchangeSwap } from "@/lib/exchange/exchangeQuery";
import type { SwapSummary } from "@/lib/chat/chatSummary";

interface Props {
  swap: ExchangeSwap;
  summary: SwapSummary | null;
  myRole: "requester" | "responder";
}

export function ExchangeSummary({ swap, summary, myRole }: Props) {
  const t = useTranslations("exchangePage");

  const myName = myRole === "requester" ? swap.requesterName : swap.responderName;
  const partnerName = myRole === "requester" ? swap.responderName : swap.requesterName;
  const title = summary?.swapTitle ?? `${t("swapId")}: ${swap.id.slice(0, 8)}`;

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5 dark:border-blue-900/40 dark:bg-blue-950/20">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">🔄</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            {t("confirmedTitle")}
          </p>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
        </div>
      </div>

      {/* Items grid */}
      {summary && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              📦 {t("youOffer")} ({myName})
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {myRole === "requester" ? summary.itemA.title : summary.itemB.title}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
              📦 {t("youReceive")} ({partnerName})
            </p>
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              {myRole === "requester" ? summary.itemB.title : summary.itemA.title}
            </p>
          </div>
        </div>
      )}

      {/* Logistics */}
      {summary && (
        <div className="mb-4 space-y-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {summary.logistics.exchangeMode && (
            <p className="text-zinc-700 dark:text-zinc-300">
              🔄 <span className="font-medium">{t("exchangeMode")}:</span> {t("simultaneous")}
            </p>
          )}
          {summary.logistics.location && (
            <p className="text-zinc-700 dark:text-zinc-300">
              📍 <span className="font-medium">{t("location")}:</span> {t("courierDelivery")}
            </p>
          )}
        </div>
      )}

      {/* Bilateral services */}
      {summary && (summary.services.escrow || summary.services.insurance) && (
        <div className="space-y-1">
          {summary.services.escrow && (
            <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
              <span className="text-base">✅</span> {t("escrowAgreed")}
            </p>
          )}
          {summary.services.insurance && (
            <p className="flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400">
              <span className="text-base">✅</span> {t("insuranceAgreed")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
