// src/app/(app)/exchanges/[id]/ReceiveConfirmation.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type ExchangeStatus =
  | "pending"
  | "accepted"
  | "shipping"
  | "in_transit"
  | "delivered"
  | "completed"
  | "cancelled"
  | string;

type Props = {
  exchangeId: string;
  status: ExchangeStatus;
};

export default function ReceiveConfirmation({ exchangeId, status }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createBrowserClient(url, anon);
  }, []);

  const canConfirm =
    status === "delivered" || status === "in_transit" || status === "shipping";

  const handleConfirm = async () => {
    if (!window.confirm("Confirmi că ai primit obiectul?")) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("exchanges")
        .update({ received_confirmed: true })
        .eq("id", exchangeId);

      if (error) throw error;

      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "A apărut o eroare la confirmare.");
    } finally {
      setLoading(false);
    }
  };

  if (!canConfirm) return null;

  return (
    <div className="space-y-3">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={loading}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Se confirmă…" : "Confirmă primirea"}
      </button>
    </div>
  );
}
