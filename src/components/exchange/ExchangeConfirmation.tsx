"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Star } from "lucide-react";
import { confirmSwap, completeSwap, submitReview } from "@/lib/exchange/exchangeServices";

interface Props {
  swapId: string;
  myUserId: string;
  partnerName: string;
  confirmedBy: string[];
  participantIds: [string, string];
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition"
        >
          <Star
            className={`h-5 w-5 ${
              star <= value ? "fill-yellow-400 text-yellow-400" : "text-zinc-300 dark:text-zinc-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ExchangeConfirmation({
  swapId,
  myUserId,
  partnerName,
  confirmedBy,
  participantIds,
}: Props) {
  const t = useTranslations("exchangePage");
  const router = useRouter();

  const alreadyConfirmed = confirmedBy.includes(myUserId);
  const [checkedReceived, setCheckedReceived] = useState(false);
  const [checkedRead, setCheckedRead] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);

  const [ratings, setRatings] = useState({ overall: 0, communication: 0, accuracy: 0, punctuality: 0 });
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const partnerId = participantIds.find((id) => id !== myUserId) ?? "";

  async function handleConfirm() {
    if (!checkedReceived || !checkedRead) return;
    setConfirming(true);
    const updated = await confirmSwap(swapId, myUserId);
    if (updated.length >= 2) {
      await completeSwap(swapId);
    }
    setConfirmed(true);
    setConfirming(false);
  }

  async function handleSubmitReview() {
    if (!ratings.overall) return;
    setSubmittingReview(true);
    await submitReview(swapId, myUserId, partnerId, ratings, comment);
    setReviewDone(true);
    setSubmittingReview(false);
    setTimeout(() => router.push("/profile"), 1500);
  }

  return (
    <div className="space-y-4">
      {/* Confirm section */}
      <div className="rounded-2xl border border-green-200 bg-green-50/40 p-5 dark:border-green-900/40 dark:bg-green-950/10">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          ✅ {t("confirmTitle")}
        </h3>

        {confirmed ? (
          <p className="text-sm font-medium text-green-700 dark:text-green-400">✅ {t("alreadyConfirmed")}</p>
        ) : (
          <>
            <label className="mb-2 flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={checkedReceived}
                onChange={(e) => setCheckedReceived(e.target.checked)}
                className="mt-0.5"
              />
              {t("confirmReceived")}
            </label>
            <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={checkedRead}
                onChange={(e) => setCheckedRead(e.target.checked)}
                className="mt-0.5"
              />
              {t("confirmRead")}
            </label>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!checkedReceived || !checkedRead || confirming}
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {confirming ? "…" : t("confirmButton")}
            </button>
          </>
        )}
      </div>

      {/* Feedback section */}
      <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-700">
        <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">
          ⭐ {t("feedbackTitle")} @{partnerName}
        </h3>

        {reviewDone ? (
          <p className="text-sm font-medium text-green-700 dark:text-green-400">✅ {t("reviewSubmitted")}</p>
        ) : (
          <div className="space-y-3">
            {(["overall", "communication", "accuracy", "punctuality"] as const).map((cat) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-zinc-600 dark:text-zinc-300">
                  {t(`rating${cat.charAt(0).toUpperCase()}${cat.slice(1)}` as Parameters<typeof t>[0])}
                </span>
                <StarRating
                  value={ratings[cat]}
                  onChange={(v) => setRatings((r) => ({ ...r, [cat]: v }))}
                />
              </div>
            ))}

            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">{t("comment")}</p>
              <textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={!ratings.overall || submittingReview}
              className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
            >
              {submittingReview ? "…" : t("submitFeedback")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
