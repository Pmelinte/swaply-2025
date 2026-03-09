"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Flag, ShieldBan } from "lucide-react";
import { useAppState } from "@/lib/state";

type ReportReason = "spam" | "harassment" | "inappropriate" | "scam" | "prohibited_item" | "other";

interface Props {
  targetUserId: string;
  targetItemId?: string;
}

export function ReportBlockButtons({ targetUserId, targetItemId }: Props) {
  const t = useTranslations("safety");
  const { user, reportUser, blockUser, unblockUser, blockedUsers } = useAppState();
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState<ReportReason>("inappropriate");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!user || user.id === targetUserId) return null;

  const isBlocked = blockedUsers.includes(targetUserId);

  const handleReport = async () => {
    await reportUser({
      reportedUserId: targetUserId,
      reportedItemId: targetItemId,
      reason,
      description,
    });
    setSubmitted(true);
    setTimeout(() => { setShowReport(false); setSubmitted(false); }, 2000);
  };

  const handleBlock = async () => {
    if (isBlocked) {
      await unblockUser(targetUserId);
    } else {
      await blockUser(targetUserId);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setShowReport(!showReport)}
        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Flag className="h-3.5 w-3.5" />
        {t("report")}
      </button>
      <button
        type="button"
        onClick={handleBlock}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${
          isBlocked
            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        }`}
      >
        <ShieldBan className="h-3.5 w-3.5" />
        {isBlocked ? t("unblock") : t("block")}
      </button>

      {showReport && (
        <div className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          {submitted ? (
            <p className="text-sm font-medium text-green-600 dark:text-green-400">{t("reportSubmitted")}</p>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {t("reportReason")}
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="spam">{t("reasonSpam")}</option>
                  <option value="harassment">{t("reasonHarassment")}</option>
                  <option value="inappropriate">{t("reasonInappropriate")}</option>
                  <option value="scam">{t("reasonScam")}</option>
                  <option value="prohibited_item">{t("reasonProhibited")}</option>
                  <option value="other">{t("reasonOther")}</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {t("reportDescription")}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  placeholder={t("reportPlaceholder")}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReport}
                  className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                >
                  {t("submitReport")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
                >
                  {t("cancelReport")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
