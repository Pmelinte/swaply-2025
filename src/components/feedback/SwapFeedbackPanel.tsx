"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  fetchMyReview,
  submitReview,
} from "@/lib/exchange/exchangeServices";

interface Props {
  swapId: string | null | undefined;
  visible: boolean;
}

function createReviewKey(swapId: string): string {
  const nonce =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `review:${swapId}:${nonce}`;
}

export function SwapFeedbackPanel({ swapId, visible }: Props) {
  const t = useTranslations("exchange.confirmation");
  const common = useTranslations("common");
  const reviewKeyRef = useRef<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (!swapId || !visible) return;

    let cancelled = false;
    void fetchMyReview(swapId).then((review) => {
      if (!cancelled && review) setSubmitted(true);
    });

    return () => {
      cancelled = true;
    };
  }, [swapId, visible]);

  async function submitFeedback() {
    if (!swapId || saving || submitted) return;

    reviewKeyRef.current ??= createReviewKey(swapId);
    setSaving(true);
    setSaveError(false);

    try {
      const result = await submitReview(
        swapId,
        rating,
        comment,
        reviewKeyRef.current,
      );
      if (result) {
        setSubmitted(true);
      } else {
        setSaveError(true);
      }
    } catch (error) {
      console.error("Chat review submission failed", error);
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!swapId || !visible) return null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">{t("feedbackTitle")}</h3>
      </div>

      {submitted ? (
        <div className="mt-4 rounded-xl bg-white/70 p-3 text-sm font-semibold dark:bg-emerald-950">
          {t("submitted")}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-semibold">{t("rating.overall")}</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={value <= rating}
                  onClick={() => setRating(value)}
                  className={`h-9 w-9 rounded-full text-sm font-bold ${
                    value <= rating
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold" htmlFor={`review-comment-${swapId}`}>
              {t("comment")}
            </label>
            <textarea
              id={`review-comment-${swapId}`}
              value={comment}
              maxLength={1000}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 dark:border-emerald-900 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void submitFeedback()}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {saving ? "…" : t("submit")}
          </button>

          {saveError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {common("errorOccurred")} {common("tryAgain")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
