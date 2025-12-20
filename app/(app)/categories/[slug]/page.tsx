// src/app/(app)/categories/[slug]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type ItemPreview = {
  id: string;
  title: string;
  primaryImageUrl: string | null;
  category: string | null;
  subcategory: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  createdAt: string;
};

type ApiResponse =
  | { ok: true; items: ItemPreview[] }
  | { ok: false; error: string };

export default function CategoryItemsPage() {
  const { slug } = useParams<{ slug: string }>();

  const [items, setItems] = useState<ItemPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/items?category=${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });

        const data: ApiResponse = await res.json();

        if (!res.ok || !data.ok) {
          setError((data as any)?.error ?? "Eroare la încărcare.");
          return;
        }

        setItems(data.items ?? []);
        setError(null);
      } catch (err) {
        console.error("[CATEGORY_ITEMS_ERROR]", err);
        setError("Eroare la încărcare.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">
        Categoria: <span className="capitalize">{slug}</span>
      </h1>

      {loading && <p>Se încarcă…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-gray-600">Nu există iteme în această categorie.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/items/${item.id}`}
            className="border rounded-lg p-3 hover:shadow transition space-y-2"
          >
            {item.primaryImageUrl ? (
              <Image
                src={item.primaryImageUrl}
                alt={item.title}
                width={300}
                height={200}
                className="h-40 w-full object-cover rounded"
              />
            ) : (
              <div className="h-40 bg-gray-200 rounded flex items-center justify-center">
                📦
              </div>
            )}

            <div className="font-semibold line-clamp-2">{item.title}</div>

            {(item.locationCity || item.locationCountry) && (
              <div className="text-xs text-gray-600">
                {[item.locationCity, item.locationCountry].filter(Boolean).join(", ")}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}