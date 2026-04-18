"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { SwapSummary } from "@/lib/chat/chatSummary";

interface Props {
  summary: SwapSummary;
  currentUserId: string;
  partnerName: string;
  participantIds: [string, string];
  onApprove: () => void;
  conversationId: string;
}

export function ChatSummary({
  summary,
  currentUserId,
  partnerName,
  participantIds,
  onApprove,
  conversationId,
}: Props) {
  const t = useTranslations("chatSummary");
  const router = useRouter();

  const hasApproved = summary.approvedBy.includes(currentUserId);
  const partnerApproved = participantIds.some(
    (id) => id !== currentUserId && summary.approvedBy.includes(id),
  );
  const bothApproved = summary.approvedBy.length >= 2 &&
    participantIds.every((id) => summary.approvedBy.includes(id));

  function handleGoToExchange() {
    router.push(`/exchange`);
  }

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
      <h3 className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-50">
        📄 {t("title")}
      </h3>

      {/* Swap title */}
      <p className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100">
        {summary.swapTitle}
      </p>

      {/* Items */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-white p-2 dark:bg-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{t("itemA")}</p>
          <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">{summary.itemA.title}</p>
          <p className="text-[10px] text-zinc-400">{summary.itemA.owner}</p>
        </div>
        <div className="rounded-xl bg-white p-2 dark:bg-zinc-800">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{t("itemB")}</p>
          <p className="mt-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-100">{summary.itemB.title}</p>
          <p className="text-[10px] text-zinc-400">{summary.itemB.owner}</p>
        </div>
      </div>

      {/* Services */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {summary.services.escrow && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            🔒 {t("escrow")}
          </span>
        )}
        {summary.services.insurance && (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            🛡️ {t("insurance")}
          </span>
        )}
        {summary.logistics.inPerson && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            🤝 {t("inPerson")}
          </span>
        )}
      </div>

      {/* Approval status */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs">
          {hasApproved
            ? <span className="text-green-600">✅ {t("youApproved")}</span>
            : <span className="text-zinc-400">⏳ {t("waitingYou")}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {partnerApproved
            ? <span className="text-green-600">✅ @{partnerName} {t("approved")}</span>
            : <span className="text-zinc-400">⏳ {t("waitingPartner", { name: partnerName })}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 space-y-2">
        {!hasApproved && (
          <button
            type="button"
            onClick={onApprove}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ✅ {t("approve")}
          </button>
        )}
        {bothApproved && (
          <button
            type="button"
            onClick={handleGoToExchange}
            className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
          >
            🎉 {t("goToExchange")} →
          </button>
        )}
      </div>
    </div>
  );
}
