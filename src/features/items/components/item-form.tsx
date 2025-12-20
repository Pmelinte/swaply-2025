// src/features/items/components/item-form.tsx
"use client";

import React, { useMemo } from "react";
import type { z } from "zod";

import type {
  Item,
  ItemFormData as LegacyItemFormData,
  ItemImage,
  ItemAiMetadata,
} from "../../items/types";

import {
  itemFormSchema,
  itemConditionValues,
  itemConditionLabels,
} from "../../items/validation";

import { useItemForm } from "../../items/hooks/use-item-form";

export type ItemFormProps = {
  mode: "create" | "edit";
  initialData?: Partial<LegacyItemFormData>;
  onSubmit: (values: LegacyItemFormData) => Promise<Item>;
};

/**
 * ✅ Tipul real al formularului (source of truth) = derivat din Zod schema.
 * Asta e compatibil 1:1 cu ce întoarce safeParse().
 */
type FormData = z.infer<typeof itemFormSchema>;

function coerceCondition(value: any): FormData["condition"] {
  // Acceptăm exact ce permite schema curentă
  if (itemConditionValues.includes(value)) return value as FormData["condition"];

  // Mapări legacy (din types.ts)
  if (value === "very_good") return "like_new";

  // fallback safe
  return "good";
}

function adaptInitialData(input?: Partial<LegacyItemFormData>): Partial<FormData> | undefined {
  if (!input) return undefined;

  return {
    title: input.title ?? "",
    description: input.description ?? "",

    category: input.category ?? "",
    subcategory: input.subcategory ?? "",
    tags: input.tags ?? [],

    condition: coerceCondition(input.condition),

    locationCity: input.locationCity ?? "",
    locationCountry: input.locationCountry ?? "",

    approximateValue: input.approximateValue ?? undefined,
    currency: input.currency ?? undefined,

    images: input.images ?? [],
    aiMetadata: input.aiMetadata,
  };
}

export function ItemForm({ mode, initialData, onSubmit }: ItemFormProps) {
  const adaptedInitial = useMemo(() => adaptInitialData(initialData), [initialData]);

  const {
    values,
    updateField,
    applyAiMetadata,
    handleSubmit,
    submitError,
    submitting,
  } = useItemForm({
    mode,
    initialData: adaptedInitial,
    onSubmit: async (v) => {
      // injectăm images din imageUrl în payload înainte de submit
      const url = (v as any).imageUrl?.trim?.() ?? "";
      const images: ItemImage[] = url ? [{ url, publicId: "manual" }] : [];

      // v este FormData (Zod). Îl putem trimite către onSubmit (legacy) fără risc,
      // pentru că condition e subset compatibil (nu include "very_good").
      const payload: LegacyItemFormData = {
        ...(v as any),
        images,
        // IMPORTANT: number | undefined (nu null)
        approximateValue: v.approximateValue ?? undefined,
      };

      return await onSubmit(payload);
    },
  });

  const conditionOptions = useMemo(() => itemConditionValues, []);

  const runAiSuggestion = async () => {
    const imageUrl = (values as any).imageUrl?.trim?.();
    if (!imageUrl) {
      alert("Adaugă întâi un URL de imagine.");
      return;
    }

    try {
      const res = await fetch("/api/ai/classify-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error ?? "AI classify failed");
      }

      const ai: ItemAiMetadata = {
        model: "huggingface-caption",
        primaryLabel: data.data?.rawCaption ?? null,
        suggestedTitle: data.data?.title,
        suggestedCategory: data.data?.categoryId,
        suggestedSubcategory: data.data?.subcategoryId,
        confidence: data.data?.rawLabels?.[0]?.score ?? undefined,
        raw: data.data,
      };

      applyAiMetadata(ai);
      if (data.data?.description) {
        updateField("description", data.data.description);
      }
      if (data.data?.condition) {
        updateField("condition", data.data.condition);
      }

      const priceRes = await fetch("/api/ai/price-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.data?.title ?? values.title,
          category: data.data?.categoryId ?? values.category,
          condition: data.data?.condition ?? values.condition,
        }),
      });
      const priceData = await priceRes.json();
      if (priceRes.ok && priceData.ok) {
        updateField("approximateValue", priceData.priceEstimateEur);
        updateField("currency", "EUR");
      }
    } catch (error: any) {
      alert(error?.message ?? "AI error");
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
          value={(values as any).imageUrl ?? ""}
          onChange={(e) => updateField("imageUrl", e.target.value)}
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
        onClick={runAiSuggestion}
        className="rounded-md border px-3 py-2 text-sm"
      >
        Completează cu AI
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
