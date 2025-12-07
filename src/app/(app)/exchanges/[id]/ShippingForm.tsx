"use client";

import { useState } from "react";
import { updateExchangeStatusAction } from "@/features/exchange/server/exchange-actions";

interface ShippingFormProps {
  exchangeId: string;
  status: string;
}

export default function ShippingForm({ exchangeId, status }: ShippingFormProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"courier" | "meeting" | "manual">("courier");
  const [awb, setAwb] = useState("");
  const [meetingPlace, setMeetingPlace] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (status !== "accepted") {
    return null;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium"
      >
        Pornește livrarea
      </button>
    );
  }

  const submitShipping = async () => {
    setLoading(true);

    // Trimitem timeline update implicit prin updateExchangeStatusAction
    await updateExchangeStatusAction(exchangeId, "shipping", "Livrarea a început.");

    // Refresh UI
    window.location.reload();
  };

  return (
    <div className="border rounded-xl p-4 bg-gray-50 space-y-4">
      <p className="font-semibold text-lg">Detalii livrare</p>

      {/* Selectare metodă */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={method === "courier"}
            onChange={() => setMethod("courier")}
          />
          Curier
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={method === "meeting"}
            onChange={() => setMethod("meeting")}
          />
          Întâlnire fizică
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={method === "manual"}
            onChange={() => setMethod("manual")}
          />
          Livrare manuală
        </label>
      </div>

      {/* CURRIER */}
      {method === "courier" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">AWB</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Ex: 1234567890"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />

          <label className="text-sm font-medium">Observații</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="ex: Fragil"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* MEETING */}
      {method === "meeting" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Locul întâlnirii</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Oraș, locație exactă"
            value={meetingPlace}
            onChange={(e) => setMeetingPlace(e.target.value)}
          />

          <label className="text-sm font-medium">Data & ora</label>
          <input
            type="datetime-local"
            className="w-full border rounded px-3 py-2"
            value={meetingTime}
            onChange={(e) => setMeetingTime(e.target.value)}
          />
        </div>
      )}

      {/* LIVRARE MANUALĂ */}
      {method === "manual" && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Detalii</label>
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="ex: Predau personal în cartierul X"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={submitShipping}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm"
        >
          {loading ? "Se procesează..." : "Confirmă livrarea"}
        </button>

        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2 bg-gray-300 text-black rounded-lg text-sm"
        >
          Închide
        </button>
      </div>
    </div>
  );
}
