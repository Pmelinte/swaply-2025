// src/app/(app)/items/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

type Item = {
  id: string;
  title: string;
  description: string | null;
  images: { url: string; isPrimary?: boolean }[] | null;
};

type ApiResponse =
  | { ok: true; item: Item }
  | { ok: false; error: string };

export default function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/items/${id}`, { cache: "no-store" });
        const data: ApiResponse = await res.json();

        if (!res.ok || !data.ok) {
          setError((data as any)?.error ?? "Eroare la încărcarea itemului.");
          return;
        }

        setItem(data.item);
        setError(null);
      } catch (err) {
        console.error("[ITEM_PAGE_LOAD_ERROR]", err);
        setError("Eroare la încărcare.");
      } finally {
        setLoading(false);
      }
    };

    if (id) load();
  }, [id]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-4">Se încarcă…</div>;
  }

  if (error || !item) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-red-600">
        {error ?? "Item inexistent."}
      </div>
    );
  }

  const primaryImage =
    item.images?.find((i) => i.isPrimary) ?? item.images?.[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Imagine */}
      {primaryImage ? (
        <Image
          src={primaryImage.url}
          alt={item.title}
          width={800}
          height={500}
          className="rounded-lg object-cover w-full"
        />
      ) : (
        <div className="h-64 bg-gray-200 rounded flex items-center justify-center">
          📦
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{item.title}</h1>

        {/* ⭐ Wishlist */}
        <WishlistButton itemId={item.id} />
      </div>

      {/* Descriere */}
      {item.description && (
        <p className="text-gray-700 whitespace-pre-line">
          {item.description}
        </p>
      )}
    </div>
  );
}