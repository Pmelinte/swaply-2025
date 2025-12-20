"use client";

import { useState } from "react";
import {
  acceptExchangeAction,
  cancelExchangeAction,
} from "@/features/exchange/server/exchange-actions";
import type { ExchangeStatus } from "@/features/exchange/types";

interface ActionsProps {
  exchangeId: string;
  status: ExchangeStatus;
}

export default function Actions({ exchangeId, status }: ActionsProps) {
  const [loading, setLoading] = useState(false);

  const accept = async () => {
    setLoading(true);
    await acceptExchangeAction(exchangeId);
    window.location.reload();
  };

  const cancel = async () => {
    if (!confirm("Ești sigur că vrei să anulezi schimbul?")) return;
    setLoading(true);
    await cancelExchangeAction(exchangeId, "Anulat de utilizator");
    window.location.reload();
  };

  // Statusuri unde nu există acțiuni
  if (status === "completed" || status === "cancelled") {
    return null;
  }

  return (
    <div className="flex gap-3 mt-4">
      {(status === "negotiating" || status === "pending") && (
        <button
          onClick={accept}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
        >
          Acceptă schimbul
        </button>
      )}

      <button
        onClick={cancel}
        disabled={loading}
        className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
      >
        Anulează
      </button>
    </div>
  );
}
