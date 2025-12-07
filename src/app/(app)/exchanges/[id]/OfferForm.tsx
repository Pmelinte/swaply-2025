"use client";

import { useState } from "react";
import { sendOfferAction } from "@/features/exchange/server/exchange-actions";
import type { ExchangeOfferItem } from "@/features/exchange/types";

interface OfferFormProps {
  exchangeId: string;
}

export default function OfferForm({ exchangeId }: OfferFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // placeholder simplu: un singur text va fi transformat în ofertă
  const [text, setText] = useState("");

  const sendOffer = async () => {
    if (!text.trim()) return;

    setLoading(true);

    // Deocamdată construim o ofertă dummy până implementăm UI cu iteme reale.
    const offered: ExchangeOfferItem[] = [
      {
        itemId: "dummy-offered",
        title: text.trim(),
        imageUrl: undefined,
      },
    ];

    const requested: ExchangeOfferItem[] = [];

    await sendOfferAction(exchangeId, offered, requested);

    setLoading(false);
    setText("");

    // forțăm reload-ul paginii pentru a arăta noua ofertă
    window.location.reload();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium"
      >
        Trimite ofertă
      </button>
    );
  }

  return (
    <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="font-semibold text-lg">Creează o ofertă</p>

      <input
        type="text"
        placeholder="Descrie ce oferi (placeholder temporar)"
        className="w-full border rounded px-3 py-2 text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-3">
        <button
          onClick={sendOffer}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          {loading ? "Se trimite..." : "Trimite oferta"}
        </button>

        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-gray-300 text-black rounded-lg text-sm"
        >
          Anulează
        </button>
      </div>

      <p className="text-xs text-gray-500">
        UI real pentru selectarea obiectelor tale va fi implementat în pasul 24.
      </p>
    </div>
  );
}
