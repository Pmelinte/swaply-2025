// src/features/items/components/my-items-list.tsx

"use client";

import Link from "next/link";
import { useTransition } from "react";

interface MyItemsListProps {
  items: Array<{
    id: string;
    title: string;

    // suportăm forma veche (cum ai acum în listă)
    primaryImageUrl?: string | null;

    // suportăm forma nouă (cum ai în DB: images jsonb)
    images?: any[] | null;

    category?: string | null;
    subcategory?: string | null;
    locationCity?: string | null;
    locationCountry?: string | null;
    isActive?: boolean | null;
  }>;
}

function pickFirstImageUrl(item: {
  primaryImageUrl?: string | null;
  images?: any[] | null;
}): string | null {
  if (item.primaryImageUrl) return item.primaryImageUrl;

  const images = item.images;
  if (!Array.isArray(images) || images.length === 0) return null;

  const first = images[0];

  // acceptăm mai multe forme posibile:
  // - string direct
  // - { url }
  // - { secure_url }
  // - { src }
  if (typeof first === "string") return first;

  if (first && typeof first === "object") {
    if (typeof first.url === "string") return first.url;
    if (typeof first.secure_url === "string") return first.secure_url;
    if (typeof first.src === "string") return first.src;
  }

  return null;
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
      {items.map((item) => {
        const imageUrl = pickFirstImageUrl(item);

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border bg-white p-3"
          >
            <Link
              href={`/items/${item.id}`}
              className="flex items-center gap-3 flex-1"
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="h-16 w-16 rounded-md object-cover bg-gray-50 border"
                  referrerPolicy="no-referrer"
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
        );
      })}
    </div>
  );
}
