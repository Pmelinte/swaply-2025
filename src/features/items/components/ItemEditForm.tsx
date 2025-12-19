// src/features/items/components/ItemEditForm.tsx

"use client";

import { useMemo, useState } from "react";
import type { Item, ItemFormData, ItemImage, ItemAiMetadata } from "../types";
import { itemConditionLabels, itemConditionValues } from "../validation";

type Props = {
  item: Item;
};

function firstImageUrl(images?: ItemImage[] | null): string {
  if (!images || images.length === 0) return "";
  return images[0]?.url ?? "";
}

export default function ItemEditForm({ item }: Props) {
  const [values, setValues] = useState<ItemFormData>(() => ({
    title: item.title ?? "",
    description: item.description ?? "",

    category: item.category ?? "",
    subcategory: item.subcategory ?? "",

    tags: item.tags ?? [],

    condition: (item.condition ?? "good") as any,

    locationCity: item.locationCity ?? "",
    locationCountry: item.locationCountry ?? "",

    approximateValue: item.approximateValue,
    currency: item.currency,

    images: item.images ?? [],
    aiMetadata: item.aiMetadata,

    status: item.status,
    isActive: item.isActive,
  } as any));

  const [imageUrl, setImageUrl] = useState<string>(() => firstImageUrl(values.images));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const conditionOptions = useMemo(() => itemConditionValues, []);

  const updateField = (field: keyof ItemFormData, value: any) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const simulateAiSuggestion = () => {
    const ai: ItemAiMetadata = {
      model: "huggingface-image-classifier",
      primaryLabel: "object",
      confidence: undefined,
      suggestedTitle: "Obiect (detectat)",
    };

    updateField("aiMetadata", ai);

    if (!values.title?.trim()) {
      updateField("title", ai.suggestedTitle);
    }
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const url = imageUrl.trim();
      const images: ItemImage[] = url ? [{ url, publicId: "manual" }] : [];

      const payload: ItemFormData = {
        ...values,
        images,
        approximateValue: values.approximateValue ?? undefined,
      } as any;

      const res = await fetch(`/api/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error ?? "Nu am putut salva.");
      }

      setSuccess("Salvat ✅");
    } catch (e: any) {
      setError(e?.message ?? "Nu am putut salva.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Titlu</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descriere</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={4}
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Imagine (URL)</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Condiție</label>
        <select
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={values.condition as any}
          onChange={(e) => updateField("condition", e.target.value)}
        >
          {conditionOptions.map((c) => (
            <option key={c} value={c}>
              {itemConditionLabels[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Oraș</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={values.locationCity}
            onChange={(e) => updateField("locationCity", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Țară</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={values.locationCountry}
            onChange={(e) => updateField("locationCountry", e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Valoare (aprox.)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={values.approximateValue ?? ""}
            onChange={(e) =>
              updateField(
                "approximateValue",
                e.target.value === "" ? undefined : Number(e.target.value),
              )
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Monedă</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={values.currency ?? ""}
            onChange={(e) => updateField("currency", e.target.value)}
            placeholder="RON"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={simulateAiSuggestion}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Simulează AI title
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Se salvează…" : "Salvează"}
      </button>
    </div>
  );
}
