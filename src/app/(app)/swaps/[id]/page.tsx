"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SwapDetailPage() {
  const params = useParams<{ id: string }>();
  const swapId = params.id as string;

  const [swap, setSwap] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [swapRes, authRes] = await Promise.all([
        fetch(`/api/swaps/${swapId}`, { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      const swapData = await swapRes.json();
      const authData = await authRes.json();

      if (!swapRes.ok || !swapData.ok) {
        setError(swapData?.error ?? "Eroare la încărcare");
        return;
      }

      setSwap(swapData.swap);
      setUserId(authData?.user?.id ?? null);
    } catch (err) {
      console.error("[SWAP_DETAIL_ERROR]", err);
      setError("Eroare la încărcare");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [swapId]);

  const act = async (action: string) => {
    try {
      const res = await fetch(`/api/swaps/${swapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data?.error ?? "Nu s-a putut actualiza.");
        return;
      }
      await load();
    } catch {
      alert("Nu s-a putut actualiza.");
    }
  };

  if (loading) return <div className="p-6">Se încarcă…</div>;
  if (error || !swap) return <div className="p-6 text-red-600">{error}</div>;

  const isReceiver = userId && swap.to_user === userId;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Swap #{swap.id.slice(0, 6)}</h1>
      <div className="text-sm text-gray-600">Status: {swap.status}</div>

      <div className="border rounded-lg p-4 space-y-2">
        <div>Ofertă: {swap.from_item ?? "?"}</div>
        <div>Vrei: {swap.to_item ?? "?"}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {swap.status === "pending" && isReceiver ? (
          <>
            <button
              className="px-4 py-2 rounded border bg-green-600 text-white"
              onClick={() => act("accept")}
            >
              Acceptă
            </button>
            <button
              className="px-4 py-2 rounded border"
              onClick={() => act("reject")}
            >
              Respinge
            </button>
          </>
        ) : null}

        {swap.status === "accepted" ? (
          <button
            className="px-4 py-2 rounded border bg-blue-600 text-white"
            onClick={() => act("confirm")}
          >
            Confirm finalizare
          </button>
        ) : null}

        {swap.status !== "complete" ? (
          <button
            className="px-4 py-2 rounded border"
            onClick={() => act("cancel")}
          >
            Anulează
          </button>
        ) : null}
      </div>

      <Link className="text-blue-600 hover:underline" href={`/chat/${swap.id}`}>
        Deschide chat
      </Link>
    </div>
  );
}
