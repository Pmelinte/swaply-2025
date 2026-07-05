"use client";

import { useState } from "react";

interface Props {
  swapId: string | null | undefined;
  visible: boolean;
}

export function SwapFeedbackPanel({ swapId, visible }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submitFeedback() {
    if (!swapId || saving || submitted) return;
    setSaving(true);
    const response = await fetch(`/api/swaps/${swapId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    if (response.ok) setSubmitted(true);
    setSaving(false);
  }

  if (!swapId || !visible) return null;

  return (
    <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">Feedback & reputation</h3>
        <p className="text-xs opacity-80">
          The swap is completed. Leave bilateral feedback so trust can grow from real exchanges.
        </p>
      </div>

      {submitted ? (
        <div className="mt-4 rounded-xl bg-white/70 p-3 text-sm font-semibold dark:bg-emerald-950">
          Feedback saved. Reputation was updated.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold">Rating</label>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
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
            <label className="text-xs font-semibold">Comment</label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="How did the exchange go?"
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
            {saving ? "Saving..." : "Submit feedback"}
          </button>
        </div>
      )}
    </section>
  );
}
