"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { SwapSummary } from "@/lib/chat/chatSummary";

export interface HaikuSummaryPayload {
  title: string;
  items_exchanged: string;
  exchange_mode: string;
  location: string;
  support_services: string;
  agreed_date: string;
}

interface Props {
  summary: SwapSummary | null;
  haikuPayload?: HaikuSummaryPayload | null;
  currentUserId: string;
  partnerName: string;
  participantIds: [string, string];
  canGenerate: boolean;
  swapId?: string | null;
  onGenerate: () => Promise<void> | void;
  onApprove: () => Promise<void> | void;
}

export function ChatSummary({
  summary,
  haikuPayload,
  currentUserId,
  partnerName,
  participantIds,
  canGenerate,
  swapId,
  onGenerate,
  onApprove,
}: Props) {
  const t = useTranslations("chat.agenda");
  const tSummary = useTranslations("chat.summary");
  const router = useRouter();

  const [generating, setGenerating] = useState(false);
  const [disabledByKillSwitch, setDisabledByKillSwitch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!canGenerate || generating) return;
    setGenerating(true);
    setError(null);
    setDisabledByKillSwitch(false);
    try {
      await onGenerate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "error";
      if (msg === "disabled") {
        setDisabledByKillSwitch(true);
      } else {
        setError(msg);
      }
    } finally {
      setGenerating(false);
    }
  }

  // No summary yet — show generate CTA
  if (!summary) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-4 dark:border-blue-800 dark:bg-blue-950/20">
        <p className="mb-3 text-sm text-zinc-700 dark:text-zinc-200">
          📄 {tSummary("title")}
        </p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? "…" : t("generateSummary")}
        </button>
        {disabledByKillSwitch && (
          <p className="mt-2 text-center text-[11px] text-amber-600 dark:text-amber-400">
            {t("summaryDisabled")}
          </p>
        )}
        {error && !disabledByKillSwitch && (
          <p className="mt-2 text-center text-[11px] text-red-500">{error}</p>
        )}
      </div>
    );
  }

  const hasApproved = summary.approvedBy.includes(currentUserId);
  const partnerApproved = participantIds.some(
    (id) => id !== currentUserId && summary.approvedBy.includes(id),
  );
  const bothApproved =
    summary.approvedBy.length >= 2 &&
    participantIds.every((id) => summary.approvedBy.includes(id));

  function handleGoToExchange() {
    if (swapId) {
      router.push(`/exchange/${swapId}`);
    } else {
      router.push("/exchange");
    }
  }

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
      <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">
        📄 {tSummary("title")}
      </h3>

      <p className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100">
        {haikuPayload?.title ?? summary.swapTitle}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-2 dark:bg-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {tSummary("itemA")}
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">
            {summary.itemA.title}
          </p>
          <p className="text-[10px] text-zinc-400">{summary.itemA.owner}</p>
        </div>
        <div className="rounded-xl bg-white p-2 dark:bg-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            {tSummary("itemB")}
          </p>
          <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">
            {summary.itemB.title}
          </p>
          <p className="text-[10px] text-zinc-400">{summary.itemB.owner}</p>
        </div>
      </div>

      {haikuPayload && (
        <dl className="mt-3 space-y-1 text-xs">
          {haikuPayload.exchange_mode && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-zinc-500">
                {tSummary("exchangeMode")}:
              </dt>
              <dd className="text-zinc-700 dark:text-zinc-200">{haikuPayload.exchange_mode}</dd>
            </div>
          )}
          {haikuPayload.location && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-zinc-500">
                {tSummary("location")}:
              </dt>
              <dd className="text-zinc-700 dark:text-zinc-200">{haikuPayload.location}</dd>
            </div>
          )}
          {haikuPayload.support_services && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-zinc-500">
                {tSummary("services")}:
              </dt>
              <dd className="text-zinc-700 dark:text-zinc-200">{haikuPayload.support_services}</dd>
            </div>
          )}
          {haikuPayload.agreed_date && (
            <div className="flex gap-2">
              <dt className="shrink-0 font-semibold text-zinc-500">
                {tSummary("date")}:
              </dt>
              <dd className="text-zinc-700 dark:text-zinc-200">{haikuPayload.agreed_date}</dd>
            </div>
          )}
        </dl>
      )}

      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          {hasApproved ? (
            <span className="text-green-600">✅ {t("approved")}</span>
          ) : (
            <span className="text-zinc-400">⏳ {tSummary("waitingYou")}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {partnerApproved ? (
            <span className="text-green-600">
              ✅ @{partnerName} {tSummary("approvedSuffix")}
            </span>
          ) : (
            <span className="text-zinc-400">
              ⏳ {t("waitingApproval")} @{partnerName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {!hasApproved && (
          <button
            type="button"
            onClick={() => {
              void onApprove();
            }}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ✅ {t("approveSummary")}
          </button>
        )}
        {bothApproved && (
          <button
            type="button"
            onClick={handleGoToExchange}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            🎉 {tSummary("goToExchange")} →
          </button>
        )}
      </div>
    </div>
  );
}
