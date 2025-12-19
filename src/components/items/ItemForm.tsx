"use client";

import { useMemo, useState } from "react";

type Props = {
  onCreated?: (itemId: string) => void;
};

type CreateItemResponse =
  | { ok: true; item: { id: string } }
  | { ok: false; error: string };

export default function ItemForm({ onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("new");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessId(null);

    try {
      setSaving(true);

      const image_url = await uploadIfNeeded();

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          condition,
          image_url
        })
      });

      const json = (await res.json()) as CreateItemResponse;

      if (!res.ok || !json.ok) {
        throw new Error((json as any)?.error ?? "Failed to create item");
      }

      setSuccessId(json.item.id);
      onCreated?.(json.item.id);

      setTitle("");
      setCondition("new");
      setFile(null);
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
          <div className="font-medium">Creat ✅</div>
          <div className="opacity-80">ID: {successId}</div>
        </div>
      )}

      <button
        disabled={!canSubmit}
        className="rounded-md border px-4 py-2 text-sm disabled:opacity-50"
      >
        {saving ? "Se salvează…" : "Creează obiect"}
      </button>
    </form>
  );
}
