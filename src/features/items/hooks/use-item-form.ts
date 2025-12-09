// src/features/items/hooks/use-item-form.ts

"use client";

import { useState } from "react";
import { itemFormSchema } from "../../items/validation";
import type {
  ItemFormData,
  ItemImage,
  ItemAiMetadata,
  Item,
} from "../../items/types";

import {
  mapAiLabelsToCategory,
  type AiNormalizedResult,
  type AiNormalizedLabel,
} from "@/lib/categories/ai-label-mapper";

interface UseItemFormOptions {
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<Item>;
}

export function useItemForm({
  mode,
  initialData = {},
  onSubmit,
}: UseItemFormOptions) {
  const [values, setValues] = useState<ItemFormData>({
    title: initialData.title ?? "",
    description: initialData.description ?? "",
    category: initialData.category ?? "",
    subcategory: initialData.subcategory ?? "",
    tags: initialData.tags ?? [],
    condition: initialData.condition ?? "good",
    locationCity: initialData.locationCity ?? "",
    locationCountry: initialData.locationCountry ?? "",
    approximateValue: initialData.approximateValue,
    currency: initialData.currency,
    images: initialData.images ?? [],
    aiMetadata: initialData.aiMetadata,
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // -----------------------------
  // Helpers interne pentru update
  // -----------------------------

  const updateField = (field: keyof ItemFormData, value: any) => {
    setValues((v) => ({
      ...v,
      [field]: value,
    }));
  };

  const addImage = (img: ItemImage) => {
    setValues((v) => ({
      ...v,
      images: [...v.images, img],
    }));
  };

  const removeImage = (publicId: string) => {
    setValues((v) => ({
      ...v,
      images: v.images.filter((img) => img.publicId !== publicId),
    }));
  };

  const setPrimaryImage = (publicId: string) => {
    setValues((v) => ({
      ...v,
      images: v.images.map((img) => ({
        ...img,
        isPrimary: img.publicId === publicId,
      })),
    }));
  };

  /**
   * Aplică metadatele AI și încearcă să deducă automat
   * categoria + subcategoria folosind mapAiLabelsToCategory.
   */
  const applyAiMetadata = (meta: ItemAiMetadata) => {
    // Construim un "rezultat AI" compatibil cu mapper-ul nostru,
    // folosind primaryLabel + suggestedTags ca sursă de adevăr.
    const aiResult: AiNormalizedResult = buildAiResultFromMeta(meta);

    const mapping = mapAiLabelsToCategory(aiResult);

    setValues((v) => {
      const nextTitle = meta.suggestedTitle ?? v.title;

      // Dacă mapping-ul a găsit ceva, îl folosim.
      // Dacă nu, cădem înapoi pe ce vine din meta sau ce era deja în formular.
      const nextCategory =
        mapping.categorySlug ||
        meta.suggestedCategory ||
        v.category ||
        "";

      const nextSubcategory =
        mapping.subcategorySlug ||
        meta.suggestedSubcategory ||
        v.subcategory ||
        "";

      const nextTags = meta.suggestedTags ?? v.tags;

      return {
        ...v,
        aiMetadata: meta,
        title: nextTitle,
        category: nextCategory,
        subcategory: nextSubcategory,
        tags: nextTags,
      };
    });
  };

  // -----------------------------
  // Validare + Submit
  // -----------------------------

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSuccess(false);

    const parsed = itemFormSchema.safeParse(values);
    if (!parsed.success) {
      const formErrors: Record<string, string> = {};

      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (typeof key === "string") {
          formErrors[key] = issue.message;
        }
      });

      setErrors(formErrors);
      setSubmitting(false);
      return;
    }

    try {
      const item = await onSubmit(parsed.data);
      setSuccess(true);
      return item;
    } catch (err: any) {
      setSubmitError(err?.message ?? "A apărut o eroare la salvare.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    values,
    errors,
    submitting,
    submitError,
    success,

    updateField,
    addImage,
    removeImage,
    setPrimaryImage,
    applyAiMetadata,
    handleSubmit,
  };
}

// -----------------------------
// Helpers pentru AI Mapping
// -----------------------------

function buildAiResultFromMeta(meta: ItemAiMetadata): AiNormalizedResult {
  const labels: AiNormalizedLabel[] = [];

  if (meta.primaryLabel) {
    labels.push({
      label: meta.primaryLabel,
      confidence: meta.confidence ?? null,
    });
  }

  if (Array.isArray(meta.suggestedTags)) {
    for (const tag of meta.suggestedTags) {
      if (typeof tag === "string" && tag.trim().length > 0) {
        labels.push({
          label: tag.trim(),
          confidence: null,
        });
      }
    }
  }

  return {
    mainLabel: meta.primaryLabel ?? null,
    labels,
    // Deocamdată nu propagăm un locale real aici;
    // dacă vei salva locale-ul user-ului, îl putem trimite din UI.
    locale: "ro",
    raw: meta,
  };
}
