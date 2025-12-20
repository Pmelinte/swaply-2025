"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SwapRow = any;

type ApiResponse =
  | { ok: true; swaps: SwapRow[] }
  | { ok: false; error: string };

export default function SwapsPage() {
  const [swaps, setSwaps] = useState<SwapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/swaps", { cache: "no-store" });
        const data: ApiResponse = await res.json();
        if (!res.ok || !data.ok) {
          setError((data as any)?.error ?? "Eroare la încărcare");
          return;
        }
        setSwaps(data.swaps ?? []);
      } catch (err) {
        console.error("[SWAPS_PAGE_ERROR]", err);
        setError("Eroare la încărcare");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Swaps</h1>
      {loading && <p>Se încarcă…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && swaps.length === 0 && (
        <p className="text-gray-600">Nu ai swap-uri încă.</p>
      )}

      <div className="space-y-3">
        {swaps.map((swap) => (
          <Link
            key={swap.id}
            href={`/swaps/${swap.id}`}
            className="block border rounded-lg p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Swap #{swap.id.slice(0, 6)}</div>
                <div className="text-xs text-gray-500">Status: {swap.status}</div>
              </div>
              <div className="text-xs text-gray-500">
                {swap.created_at?.slice(0, 10)}
              </div>
            </div>
            <div className="text-sm text-gray-700 mt-2">
              Tu: {swap.from_item?.title ?? "?"} ↔ {swap.to_item?.title ?? "?"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
