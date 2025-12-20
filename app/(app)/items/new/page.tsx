// src/app/(app)/items/new/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ApiOk = { ok: true; item: any };
type ApiErr = { ok: false; error: string };

export default function NewItemPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<"new" | "like_new" | "good" | "fair" | "poor">("good");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          condition,
          locationCity,
          locationCountry,
          // restul rămân opționale în contract
          tags: [],
          images: [],
        }),
      });

      const data = (await res.json()) as ApiOk | ApiErr;

      if (!res.ok || !data.ok) {
        setError(!data.ok ? data.error : "create_failed");
        return;
      }

      // după create: mergem înapoi la lista mea
      router.push("/items");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "network_error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-6 space-y-4">
      <header className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Add Item</h1>
        <div className="ml-auto">
          <Link href="/items" className="px-3 py-2 rounded-lg border bg-white">
            Back
          </Link>
        </div>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800">
          <strong>Oops:</strong> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold">Titlu</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="Ex: iPhone 13"
            required
            minLength={2}
            maxLength={80}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">Descriere</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="Minim 10 caractere…"
            rows={5}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">Categorie</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border"
            placeholder="Ex: electronics"
            required
            minLength={2}
            maxLength={50}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">Condiție</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg border bg-white"
          >
            <option value="new">Nou</option>
            <option value="like_new">Ca nou</option>
            <option value="good">Bun</option>
            <option value="fair">Acceptabil</option>
            <option value="poor">Slab</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-semibold">Oraș</label>
            <input
              value={locationCity}
              onChange={(e) => setLocationCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              placeholder="Ex: Tulcea"
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold">Țară</label>
            <input
              value={locationCountry}
              onChange={(e) => setLocationCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              placeholder="Ex: România"
              required
              minLength={2}
              maxLength={80}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save"}
        </button>

        <p className="text-xs text-gray-500">
          Imagini, tags, subcategorie: le adăugăm după ce închidem soft-delete & curățenia.
        </p>
      </form>
    </main>
  );
}
