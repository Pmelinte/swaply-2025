"use client";

import { useState } from "react";
import { submitReviewAction } from "@/features/reviews/server/reviews-actions";

interface RateFormProps {
  exchangeId: string;
  viewerId: string;
  reviews: Array<{
    reviewerId: string;
    stars: number;
    comment?: string;
  }>;
  status: string;
}

export default function RateForm({ exchangeId, viewerId, reviews, status }: RateFormProps) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Formularul apare DOAR dacă schimbul este complet
  if (status !== "completed") return null;

  // Dacă userul a lăsat deja review → nu arătăm formularul
  const alreadyReviewed = reviews.some((r) => r.reviewerId === viewerId);
  if (alreadyReviewed) return null;

  const submit = async () => {
    setLoading(true);

    await submitReviewAction({
      exchangeId,
      stars,
      comment: comment.trim() || undefined,
    });

    window.location.reload();
  };

  return (
    <div className="border rounded-xl p-4 bg-gray-50 space-y-4">
      <p className="font-semibold text-lg">Lasă un review</p>

      {/* Stele */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} filled={s <= stars} onClick={() => setStars(s)} />
        ))}
      </div>

      {/* Comentariu */}
      <div>
        <label className="block text-sm font-medium mb-1">Comentariu (opțional)</label>
        <textarea
          className="w-full border rounded-lg px-3 py-2 text-sm"
          rows={3}
          placeholder="Scrie un feedback scurt..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
      >
        {loading ? "Se trimite..." : "Trimite review"}
      </button>
    </div>
  );
}

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      className={`cursor-pointer text-2xl ${
        filled ? "text-yellow-500" : "text-gray-400"
      }`}
    >
      ★
    </span>
  );
}
