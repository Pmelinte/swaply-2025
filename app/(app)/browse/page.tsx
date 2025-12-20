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
        className="grid grid-cols-1 md:grid-cols-6 gap-3 rounded-lg border bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-gray-600">Căutare</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="titlu, descriere, tag"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Categorie</label>
          <input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="electronics"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Subcategorie</label>
          <input
            value={subcategory}
            onChange={(event) => setSubcategory(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="phones"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Stare</label>
          <input
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="new / good"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600">Locație</label>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="București"
          />
        </div>

        <div className="md:col-span-6 flex flex-wrap gap-2">
          <button
            type="submit"
            className="px-3 py-2 rounded-md border bg-black text-white text-sm"
            disabled={loading}
          >
            {loading ? "Se caută..." : "Aplică filtre"}
          </button>

          <button
            type="button"
            className="px-3 py-2 rounded-md border text-sm"
            onClick={() => {
              setQuery("");
              setCategory("");
              setSubcategory("");
              setCondition("");
              setLocation("");
              setTimeout(() => load(), 0);
            }}
          >
            Resetează
          </button>
        </div>
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
              <Link
                href={`/items/${item.id}`}
                className="font-semibold line-clamp-2 hover:underline"
              >
                {item.title}
              </Link>

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

              <div className="pt-2 text-xs text-blue-600">
                Vezi detalii →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
