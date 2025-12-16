// src/features/items/components/item-form.tsx
"use client";

import React, { useMemo, useState } from "react";
import type { Item, ItemFormData, ItemImage, ItemAiMetadata } from "../../items/types";
import {
  itemConditionValues,
  itemConditionLabels,
} from "../../items/validation";
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
  const [imageUrl, setImageUrl] = useState<string>(() =>
    firstImageUrl(initialData?.images ?? []),
  );

  const {
    values,
    updateField,
    handleSubmit,
    submitError,
    submitting,
  } = useItemForm({
    mode,
    initialData,
    onSubmit: async (v) => {
      // injectăm images din imageUrl în payload înainte de submit
      const url = imageUrl.trim();
      const images: ItemImage[] = url ? [{ url, publicId: "manual" }] : [];

      const payload: ItemFormData = {
        ...v,
        images,
        // IMPORTANT: number | undefined (nu null)
        approximateValue: v.approximateValue ?? undefined,
      };

      return await onSubmit(payload);
    },
  });

  const conditionOptions = useMemo(() => itemConditionValues, []);

  // ✅ Fix-ul de tip: confidence nu va fi niciodată null, doar undefined
  const simulateAiSuggestion = () => {
    const ai: ItemAiMetadata = {
      model: "huggingface-image-classifier",
      primaryLabel: "object",
      confidence: undefined, // ✅ nu null
      suggestedTitle: "Obiect (detectat)",
    };

    updateField("aiMetadata", ai);

    // auto-fill titlu dacă e gol
    if (!values.title?.trim()) {
      updateField("title", ai.suggestedTitle);
    }
  };

  return (
    <div className="space-y-4">
      {submitError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium">Titlu</label>
        <input
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="ex: Bicicletă MTB"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descriere</label>
        <textarea
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          rows={4}
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
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
        onClick={handleSubmit}
        disabled={submitting}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {submitting ? "Se salvează…" : mode === "edit" ? "Salvează" : "Creează"}
      </button>
    </div>
  );
}

export default ItemForm;
