// src/app/(app)/wishlist/page.tsx

"use client";

import { useEffect, useState } from "react";
import type { WishlistEntry, WishlistApiResponse } from "@/features/wishlist/types";

export default function WishlistPage() {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/wishlist", { cache: "no-store" });
      const data: WishlistApiResponse = await res.json();

      if (!res.ok || !data.ok) {
        setError((data as any)?.error ?? "Eroare la încărcarea wishlist-ului.");
        return;
      }

      setEntries(data.entries ?? []);
      setError(null);
    } catch (err) {
      console.error("[WISHLIST_UI_ERROR]", err);
      setError("Eroare la încărcarea wishlist-ului.");
    } finally {
      setLoading(false);
    }
  };

  const removeEntry = async (entryId: string) => {
    if (!confirm("Eliminăm această preferință?")) return;

    try {
      await fetch(`/api/wishlist/${entryId}`, { method: "DELETE" });
      setEntries((i) => i.filter((x) => x.id !== entryId));
    } catch {
      alert("Nu s-a putut elimina preferința.");
    }
  };

  const addEntry = async () => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: category.trim() || null,
          subcategory: subcategory.trim() || null,
          brand: brand.trim() || null,
          condition: condition.trim() || null,
          priceMin: priceMin ? Number(priceMin) : null,
          priceMax: priceMax ? Number(priceMax) : null,
        }),
      });

      const data: WishlistApiResponse = await res.json();
      if (!res.ok || !data.ok) {
        alert((data as any)?.error ?? "Nu s-a putut salva.");
        return;
      }

      setEntries((prev) => [...data.entries, ...prev]);
      setCategory("");
      setSubcategory("");
      setBrand("");
      setCondition("");
      setPriceMin("");
      setPriceMax("");
    } catch {
      alert("Nu s-a putut salva.");
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

      <div className="border rounded-lg p-4 space-y-3">
        <h2 className="font-semibold">Adaugă preferință</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Categorie"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Subcategorie"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Condiție"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Preț min"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
          />
          <input
            className="rounded border px-3 py-2 text-sm"
            placeholder="Preț max"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
          />
        </div>
        <button
          className="rounded bg-black text-white px-4 py-2 text-sm"
          onClick={addEntry}
        >
          Salvează
        </button>
      </div>

      {!loading && entries.length === 0 && (
        <p className="text-gray-600">Wishlist-ul tău este gol.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <div key={entry.id} className="border rounded-lg p-3 space-y-2">
            <div className="font-semibold">Preferință #{entry.id.slice(0, 6)}</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Categorie: {entry.category ?? "-"}</div>
              <div>Subcategorie: {entry.subcategory ?? "-"}</div>
              <div>Brand: {entry.brand ?? "-"}</div>
              <div>Condiție: {entry.condition ?? "-"}</div>
              <div>
                Preț: {entry.priceMin ?? "-"} - {entry.priceMax ?? "-"}
              </div>
            </div>
            <button
              onClick={() => removeEntry(entry.id)}
              className="text-red-600 text-sm hover:underline"
            >
              Elimină
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
