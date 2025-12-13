// src/app/(app)/wishlist/page.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { WishlistItemPreview, WishlistApiResponse } from "@/features/wishlist/types";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItemPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      const data: WishlistApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcarea wishlist-ului.");
        return;
      }

      // fallback: dacă API întoarce doar entries, afișăm minim
      const previews =
        data.items ??
        (data.entries ?? []).map((e) => ({
          id: e.id,
          itemId: e.itemId,
          title: null,
          primaryImageUrl: null,
          createdAt: e.createdAt,
        }));

      setItems(previews);
      setError(null);
    } catch (err) {
      console.error("[WISHLIST_UI_ERROR]", err);
      setError("Eroare la încărcarea wishlist-ului.");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!confirm("Eliminăm acest item din wishlist?")) return;

    try {
      await fetch(`/api/wishlist/${itemId}`, { method: "DELETE" });
      setItems((i) => i.filter((x) => x.itemId !== itemId));
    } catch {
      alert("Nu s-a putut elimina itemul.");
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Wishlist</h1>

      {loading && <p>Se încarcă…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-600">Wishlist-ul tău este gol.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div key={item.id} className="border rounded-lg p-3 space-y-2">
            {item.primaryImageUrl ? (
              <Image
                src={item.primaryImageUrl}
                alt=""
                width={300}
                height={200}
                className="rounded object-cover h-40 w-full"
              />
            ) : (
              <div className="h-40 bg-gray-200 rounded flex items-center justify-center">
                📦
              </div>
            )}

            <div className="font-semibold line-clamp-2">
              {item.title ?? "Item salvat"}
            </div>

            <div className="flex justify-between items-center text-sm">
              <Link
                href={`/items/${item.itemId}`}
                className="text-blue-600 hover:underline"
              >
                Vezi
              </Link>

              <button
                onClick={() => removeItem(item.itemId)}
                className="text-red-600 hover:underline"
              >
                Elimină
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}