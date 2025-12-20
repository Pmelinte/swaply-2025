// src/app/(app)/exchanges/[id]/RateForm.tsx
"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ExchangeStatus =
  | "pending"
  | "accepted"
  | "shipping"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | string;

export type Review = {
  id?: string;
  exchange_id?: string;
  reviewer_id?: string;
  rating: number;
  comment?: string | null;
  created_at?: string;
};

export type RateFormProps = {
  exchangeId: string;
  viewerId: string;
  status: ExchangeStatus;
  reviews?: Review[]; // ✅ acum e optional
};

export default function RateForm({
  exchangeId,
  viewerId,
  status,
  reviews = [],
}: RateFormProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canRate = status === "completed";
  if (!canRate) return null;

  const alreadyReviewed = reviews.some((r) => r.reviewer_id === viewerId);
  if (alreadyReviewed) return null;

  const submit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        exchange_id: exchangeId,
        reviewer_id: viewerId,
        rating,
        comment: comment.trim() ? comment.trim() : null,
      };

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) throw error;

      setSuccess("Review salvat ✅");
      setComment("");
      setRating(5);
    } catch (e: any) {
      setError(e?.message ?? "Eroare la trimiterea review-ului.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div>
        <h3 className="text-base font-semibold">Lasă un review</h3>
        <p className="text-sm text-muted-foreground">
          După ce schimbul e complet, poți evalua experiența.
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Rating</label>
        <select
          className="rounded-md border px-2 py-1 text-sm"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          disabled={loading}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Comentariu (opțional)</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
          placeholder="Cum a fost schimbul?"
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Se trimite…" : "Trimite review"}
      </button>
    </div>
  );
}
