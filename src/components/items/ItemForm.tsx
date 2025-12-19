"use client";

import { useMemo, useState } from "react";

type Props = {
  mode?: "create" | "edit" | string;

  /**
   * Compat: unele pagini trimit un onSubmit care așteaptă un form complex.
   * Ca să nu blocăm build-ul, acceptăm orice form shape.
   */
  onSubmit?: (values: any) => Promise<any>;

  onCreated?: (itemId: string) => void;
};

type CreateItemResponse =
  | { ok: true; item: { id: string } }
  | { ok: false; error: string };

export default function ItemForm({ mode, onSubmit, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("new");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationCountry, setLocationCountry] = useState("");

  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return !saving && title.trim().length > 1;
  }, [saving, title]);

  async function uploadIfNeeded(): Promise<string | null> {
    if (!file) return null;

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload-image", {
      method: "POST",
      body: fd
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message ?? "Upload failed");
    }

    return json?.image_url ?? null;
  }

  async function defaultCreate(values: any): Promise<string> {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const json = (await res.json()) as CreateItemResponse;

    if (!res.ok || !json.ok) {
      throw new Error((json as any)?.error ?? "Failed to create item");
    }

    return json.item.id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessId(null);

    try {
      setSaving(true);

      const image_url = await uploadIfNeeded();

      // Form “maxim compatibil” cu ce poate cere pagina /items/add
      const values: any = {
        title: title.trim(),
        condition,
        image_url,
        description,
        category,
        locationCity,
        locationCountry
      };

      if (onSubmit) {
        const result = await onSubmit(values);

        const id =
          result?.id ??
          result?.item?.id ??
          result?.data?.id ??
          result?.data?.item?.id ??
          null;

        if (id) {
          setSuccessId(String(id));
          onCreated?.(String(id));
        } else {
          setSuccessId("created");
        }
      } else {
        const id = await defaultCreate(values);
        setSuccessId(id);
        onCreated?.(id);
      }

      if (String(mode ?? "create").toLowerCase().includes("create")) {
        setTitle("");
        setCondition("new");
        setDescription("");
        setCategory("");
        setLocationCity("");
        setLocationCountry("");
        setFile(null);
      }
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Titlu</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Ex: Bicicletă, carte, scaun..."
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Descriere</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
          rows={3}
          placeholder="Detalii…"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Categorie</label>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Ex: electronice"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Stare</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="new">Nou</option>
            <option value="like_new">Ca nou</option>
            <option value="used">Utilizat</option>
            <option value="vintage">Vintage / Antic</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">Oraș</label>
          <input
            value={locationCity}
            onChange={(e) => setLocationCity(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Ex: Tulcea"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Țară</label>
          <input
            value={locationCountry}
            onChange={(e) => setLocationCountry(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Ex: România"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Poză (opțional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
      </div>

      {error && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium">Eroare</div>
          <div className="opacity-80">{error}</div>
        </div>
      )}

      {successId && (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium">OK ✅</div>
          <div className="opacity-80">
            {successId === "created" ? "Creat." : `ID: ${successId}`}
          </div>
        </div>
      )}

      <button
        disabled={!canSubmit}
        className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
      >
        {saving ? "Se salvează…" : "Salvează"}
      </button>
    </form>
  );
}
