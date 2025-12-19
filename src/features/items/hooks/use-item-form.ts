// src/features/items/hooks/use-item-form.ts

"use client";

import { useState } from "react";
import type { z } from "zod";
import { itemFormSchema } from "../../items/validation";
import type { ItemImage, ItemAiMetadata, Item } from "../../items/types";

import {
  mapAiLabelsToCategory,
  type AiNormalizedResult,
  type AiNormalizedLabel,
} from "@/lib/categories/ai-label-mapper";

/**
 * ✅ Source of truth pentru tipul formularului:
 * îl derivăm direct din Zod schema, ca să nu mai avem mismatch-uri.
 */
type FormData = z.infer<typeof itemFormSchema>;

interface UseItemFormOptions {
  mode: "create" | "edit";
  initialData?: Partial<FormData>;
  onSubmit: (values: FormData) => Promise<Item>;
}

function getImageKey(img: any): string {
  // compat: forma nouă folosește "id", forma veche folosește "publicId"
  return (img?.id ?? img?.publicId ?? img?.url ?? "").toString();
}

export function useItemForm({
  mode,
  initialData = {},
  onSubmit,
}: UseItemFormOptions) {
  const [values, setValues] = useState<FormData>({
    title: initialData.title ?? "",
    description: initialData.description ?? "",
    category: initialData.category ?? "",
    subcategory: initialData.subcategory ?? "",
    tags: initialData.tags ?? [],
    condition: (initialData.condition ?? "good") as FormData["condition"],
    locationCity: initialData.locationCity ?? "",
    locationCountry: initialData.locationCountry ?? "",
    approximateValue: initialData.approximateValue,
    currency: initialData.currency,

    // ✅ FIX: schema cere imageUrl (legacy field din form)
    imageUrl: (initialData as any).imageUrl ?? "",

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

  const updateField = (field: keyof FormData, value: any) => {
    setValues((v) => ({
      ...v,
      [field]: value,
    }));
  };

  const addImage = (img: ItemImage) => {
    setValues((v) => ({
      ...v,
      images: [...(v.images ?? []), img],
    }));
  };

  const removeImage = (key: string) => {
    setValues((v) => ({
      ...v,
      images: (v.images ?? []).filter((img: any) => getImageKey(img) !== key),
    }));
  };

  const setPrimaryImage = (key: string) => {
    setValues((v) => ({
      ...v,
      images: (v.images ?? []).map((img: any) => ({
        ...img,
        isPrimary: getImageKey(img) === key,
      })),
    }));
  };

  /**
   * Aplică metadatele AI și încearcă să deducă automat
   * categoria + subcategoria folosind mapAiLabelsToCategory.
   */
  const applyAiMetadata = (meta: ItemAiMetadata) => {
    const aiResult: AiNormalizedResult = buildAiResultFromMeta(meta);
    const mapping = mapAiLabelsToCategory(aiResult);

    setValues((v) => {
      const nextTitle = (meta as any).suggestedTitle ?? (v.title ?? "");

      const nextCategory =
        mapping.categorySlug ||
        (meta as any).suggestedCategory ||
        (v.category ?? "") ||
        "";

      const nextSubcategory =
        mapping.subcategorySlug ||
        (meta as any).suggestedSubcategory ||
        (v.subcategory ?? "") ||
        "";

      const nextTags = (meta as any).suggestedTags ?? (v.tags ?? []);

      return {
        ...v,
        aiMetadata: meta as any,
        title: nextTitle as any,
        category: nextCategory as any,
        subcategory: nextSubcategory as any,
        tags: nextTags as any,
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
      // ✅ parsed.data are exact tipul FormData
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

  if ((meta as any).primaryLabel) {
    labels.push({
      label: (meta as any).primaryLabel,
      confidence: (meta as any).confidence ?? null,
    });
  }

  if (Array.isArray((meta as any).suggestedTags)) {
    for (const tag of (meta as any).suggestedTags) {
      if (typeof tag === "string" && tag.trim().length > 0) {
        labels.push({
          label: tag.trim(),
          confidence: null,
        });
      }
    }
  }

  return {
    mainLabel: (meta as any).primaryLabel ?? null,
    labels,
    locale: "ro",
    raw: meta as any,
  };
}
