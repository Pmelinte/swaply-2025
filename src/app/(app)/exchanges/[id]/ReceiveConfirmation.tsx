"use client";

import { useState } from "react";
import { updateExchangeStatusAction } from "@/features/exchange/server/exchange-actions";

interface ReceiveConfirmationProps {
  exchangeId: string;
  status: string;
}

export default function ReceiveConfirmation({
  exchangeId,
  status,
}: ReceiveConfirmationProps) {
  const [loading, setLoading] = useState(false);

  // Arătăm butonul DOAR când schimbul este în livrare
  if (status !== "shipping") {
    return null;
  }

  const confirm = async () => {
    if (!confirm("Confirmi că ai primit obiectul?")) return;

    setLoading(true);

    await updateExchangeStatusAction(
      exchangeId,
      "completed",
      "Coletul a fost primit."
    );

    window.location.reload();
  };

  return (
    <div className="flex">
      <button
        onClick={confirm}
        disabled={loading}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium"
      >
        {loading ? "Se confirmă..." : "Am primit coletul"}
      </button>
    </div>
  );
}
