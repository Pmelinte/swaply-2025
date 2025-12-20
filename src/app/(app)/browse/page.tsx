// src/app/(app)/browse/page.tsx

"use client";

import { useEffect, useState } from "react";
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

export default function BrowsePage() {
  const [items, setItems] = useState<ItemPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [condition, setCondition] = useState("");
  const [location, setLocation] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "48");
      if (query.trim()) params.set("q", query.trim());
      if (category.trim()) params.set("category", category.trim());
      if (subcategory.trim()) params.set("subcategory", subcategory.trim());
      if (condition.trim()) params.set("condition", condition.trim());
      if (location.trim()) params.set("location", location.trim());

      const res = await fetch(`/api/items/public?${params.toString()}`, {
        cache: "no-store",
      });
      const data: ApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcare item-uri.");
        return;
      }

      setItems(data.items);
      setError(null);
    } catch (err) {
      console.error("[BROWSE_PAGE_LOAD_ERROR]", err);
      setError("Eroare la încărcare item-uri.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Obiecte disponibile</h1>

        <div className="ml-auto flex gap-2">
          <Link
            href="/items"
            className="px-3 py-2 rounded-lg border bg-white"
          >
            My Items
          </Link>
        </div>
      </div>

      <form
        className="grid gap-3 md:grid-cols-5 items-end"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Căutare</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="titlu, descriere"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Categorie</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="electronics"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Subcategorie</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="phones"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Condiție</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="good"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Locație (aprox.)</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="București, RO"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="md:col-span-1 rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Caută
        </button>
      </form>

      {loading && <p>Se încarcă…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && items.length === 0 && (
        <p className="text-gray-600">Nu există obiecte disponibile.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden bg-white"
            title={item.title}
          >
            {item.primaryImageUrl ? (
              <Image
                src={item.primaryImageUrl}
                alt={item.title}
                width={400}
                height={300}
                className="h-40 w-full object-cover"
              />
            ) : (
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                📦
              </div>
            )}

            <div className="p-3 space-y-1">
              <div className="font-semibold line-clamp-2">{item.title}</div>

              <div className="text-xs text-gray-500">
                {item.category}
                {item.subcategory ? ` / ${item.subcategory}` : ""}
              </div>

              {(item.locationCity || item.locationCountry) && (
                <div className="text-xs text-gray-600">
                  📍 {item.locationCity}
                  {item.locationCountry ? `, ${item.locationCountry}` : ""}
                </div>
              )}

              <Link
                href={`/items/${item.id}`}
                className="pt-2 text-xs text-blue-600 hover:underline"
              >
                Vezi detalii
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
