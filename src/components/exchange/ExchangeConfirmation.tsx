"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Star } from "lucide-react";
import {
  confirmSwap,
  fetchMyReview,
  submitReview,
} from "@/lib/exchange/exchangeServices";

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

function createOperationKey(kind: "completion" | "review", swapId: string, userId: string): string {
  const nonce =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${kind}:${swapId}:${userId}:${nonce}`;
}

export function ExchangeConfirmation({
  swapId,
  myUserId,
  partnerName,
  confirmedBy,
}: Props) {
  const t = useTranslations("exchange.confirmation");
  const common = useTranslations("common");
  const router = useRouter();

  const alreadyConfirmed = confirmedBy.includes(myUserId);
  const completionKeyRef = useRef<string | null>(null);
  const reviewKeyRef = useRef<string | null>(null);
  const [checkedReceived, setCheckedReceived] = useState(false);
  const [checkedRead, setCheckedRead] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);
  const [confirmationError, setConfirmationError] = useState(false);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewError, setReviewError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchMyReview(swapId).then((review) => {
      if (!cancelled && review) setReviewDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [swapId]);

  async function handleConfirm() {
    if (!checkedReceived || !checkedRead || confirming) return;

    completionKeyRef.current ??= createOperationKey("completion", swapId, myUserId);
    setConfirming(true);
    setConfirmationError(false);

    try {
      const result = await confirmSwap(swapId, completionKeyRef.current);
      if (!result) {
        setConfirmationError(true);
        return;
      }

      setConfirmed(true);
      if (result.both_confirmed) {
        router.refresh();
      }
    } catch (error) {
      console.error("Exchange completion confirmation failed", error);
      setConfirmationError(true);
    } finally {
      setConfirming(false);
    }
  }

  async function handleSubmitReview() {
    if (!rating || submittingReview || reviewDone) return;

    reviewKeyRef.current ??= createOperationKey("review", swapId, myUserId);
    setSubmittingReview(true);
    setReviewError(false);

    try {
      const result = await submitReview(
        swapId,
        rating,
        comment,
        reviewKeyRef.current,
      );
      if (!result) {
        setReviewError(true);
        return;
      }

      setReviewDone(true);
      setTimeout(() => router.push("/profile?swap=completed"), 1500);
    } catch (error) {
      console.error("Exchange review submission failed", error);
      setReviewError(true);
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-green-200 bg-green-50/40 p-5 dark:border-green-900/40 dark:bg-green-950/10">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          ✅ {t("title")}
        </h3>

        {confirmed ? (
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ✅ {t("alreadyConfirmed")}
          </p>
        ) : (
          <>
            <label className="mb-2 flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={checkedReceived}
                onChange={(event) => setCheckedReceived(event.target.checked)}
                className="mt-0.5"
              />
              {t("received")}
            </label>
            <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={checkedRead}
                onChange={(event) => setCheckedRead(event.target.checked)}
                className="mt-0.5"
              />
              {t("accepted")}
            </label>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!checkedReceived || !checkedRead || confirming}
              className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {confirming ? "…" : t("confirm")}
            </button>
            {confirmationError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {common("errorOccurred")} {common("tryAgain")}
              </p>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-700">
        <h3 className="mb-4 font-semibold text-zinc-900 dark:text-zinc-50">
          ⭐ {t("feedbackTitle")} @{partnerName}
        </h3>

        {reviewDone ? (
          <p className="text-sm font-medium text-green-700 dark:text-green-400">
            ✅ {t("submitted")}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">
                {t("rating.overall")}
              </span>
              <StarRating value={rating} onChange={setRating} />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-zinc-500">{t("comment")}</p>
              <textarea
                rows={3}
                value={comment}
                maxLength={1000}
                onChange={(event) => setComment(event.target.value)}
                className="w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmitReview}
              disabled={!rating || submittingReview}
              className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-60"
            >
              {submittingReview ? "…" : `${t("submit")} →`}
            </button>

            {reviewError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {common("errorOccurred")} {common("tryAgain")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
