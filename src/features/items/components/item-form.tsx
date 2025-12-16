// src/features/items/components/item-form.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Item, ItemFormData, ItemImage, ItemAiMetadata } from "../../items/types";
import { itemFormSchema, itemConditionValues, itemConditionLabels } from "../../items/validation";
import { useItemForm } from "../../items/hooks/use-item-form";

export type ItemFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<Item>;
};

function firstImageUrl(images?: ItemImage[] | null): string {
  if (!images || images.length === 0) return "";
  return images[0]?.url ?? "";
}

export function ItemForm({ mode, initialData, onSubmit }: ItemFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Simplu: un singur URL de imagine (îl mapăm în images[0])
  const [imageUrl, setImageUrl] = useState<string>(() => firstImageUrl(initialData?.images ?? []));

  const { values, setValues } = useItemForm({
    mode,
    initialData,
    onSubmit: async (v) => v as any, // nu îl folosim direct aici; apelăm onSubmit noi, mai jos
  });

  const conditionOptions = useMemo(() => itemConditionValues, []);

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      // 1) Construim values finale
      const url = imageUrl.trim();
      const images: ItemImage[] = url ? [{ url, publicId: "manual" }] : [];

      const next: ItemFormData = {
        ...values,
        images,
        // IMPORTANT: approximateValue trebuie să fie number | undefined, nu null
        approximateValue: values.approximateValue ?? undefined,
      };

      // 2) Validare Zod (ca să nu împingi gunoi în DB)
      const parsed = itemFormSchema.parse(next);

      // 3) Submit
      await onSubmit(parsed as unknown as ItemFormData);
    } catch (e: any) {
      setError(e?.message ?? "Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * AI metadata builder (aici era eroarea ta: confidence era number | null)
   * -> îl normalizez la number | undefined.
   */
  const setAiSuggestion = (primaryLabel: string, topConfidence: number | null, suggestedTitle: string) => {
    const ai: ItemAiMetadata = {
      model: "huggingface-image-classifier",
      primaryLabel,
      confidence: topConfidence ?? undefined, // ✅ FIX: nu mai e null
      suggestedTitle,
    };

    setValues((prev) => ({
      ...prev,
      aiMetadata: ai,
      // dacă vrei auto-fill de titlu:
      title: prev.title?.trim() ? prev.title : suggestedTitle,
    }));
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Titlu</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={values.title}
          onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
          placeholder="ex: Bicicletă MTB"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descriere</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={4}
          value={values.description}
          onChange={(e) => setValues((p) => ({ ...p, description: e.target.value }))}
          placeholder="Detalii…"
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
          value={values.condition}
          onChange={(e) => setValues((p) => ({ ...p, condition: e.target.value as any }))}
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
            onChange={(e) => setValues((p) => ({ ...p, locationCity: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Țară</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={values.locationCountry}
            onChange={(e) => setValues((p) => ({ ...p, locationCountry: e.target.value }))}
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
              setValues((p) => ({
                ...p,
                approximateValue: e.target.value === "" ? undefined : Number(e.target.value),
              }))
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Monedă</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={values.currency ?? ""}
            onChange={(e) => setValues((p) => ({ ...p, currency: e.target.value }))}
            placeholder="RON"
          />
        </div>
      </div>

      {/* Mic “buton de test” pentru AI metadata (doar ca să existe call path-ul).
          Îl poți șterge după ce build-ul e verde. */}
      <button
        type="button"
        onClick={() => setAiSuggestion("object", null, "Obiect (detectat)")}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Simulează AI title
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Se salvează…" : mode === "edit" ? "Salvează" : "Creează"}
      </button>
    </div>
  );
}
