// src/features/items/components/my-items-list.tsx

"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";

interface MyItemsListProps {
  items: Array<{
    id: string;
    title: string;
    primaryImageUrl?: string | null;
    category?: string | null;
    subcategory?: string | null;
    locationCity?: string | null;
    locationCountry?: string | null;
    isActive?: boolean | null;
  }>;
}

export default function MyItemsList({ items }: MyItemsListProps) {
  const [pending, start] = useTransition();

  const onDelete = (itemId: string) => {
    start(async () => {
      try {
        const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
        const data = await res.json();

        if (!res.ok || !data?.ok) {
          throw new Error(data?.error ?? "Nu am putut șterge item-ul.");
        }

        window.location.reload();
      } catch (e: any) {
        alert(e?.message ?? "Nu am putut șterge item-ul.");
      }
    });
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg border bg-white p-3"
        >
          <Link href={`/items/${item.id}`} className="flex items-center gap-3 flex-1">
            {item.primaryImageUrl ? (
              <Image
                src={item.primaryImageUrl}
                alt={item.title}
                width={80}
                height={80}
                className="h-16 w-16 rounded-md object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                📦
              </div>
            )}

            <div className="min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="text-xs text-gray-500">
                {item.category || ""}
                {item.subcategory ? ` / ${item.subcategory}` : ""}
              </div>
              {(item.locationCity || item.locationCountry) && (
                <div className="text-xs text-gray-600">
                  📍 {item.locationCity || ""}
                  {item.locationCountry ? `, ${item.locationCountry}` : ""}
                </div>
              )}
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* ✅ Soft-delete / archive e nefinalizat => dezactivat elegant */}
            <button
              type="button"
              disabled
              title="Arhivarea (soft-delete) va fi disponibilă în curând."
              className="rounded-md border px-2 py-1 text-xs opacity-50 cursor-not-allowed"
            >
              Arhivează
            </button>

            <Link
              href={`/items/${item.id}/edit`}
              className="rounded-md border px-2 py-1 text-xs"
            >
              Editează
            </Link>

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              disabled={pending}
              className="rounded-md border px-2 py-1 text-xs"
            >
              {pending ? "Șterge…" : "Șterge"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
