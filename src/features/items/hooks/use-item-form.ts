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

interface UseItemFormOptions {
  mode: "create" | "edit";
  initialData?: Partial<ItemFormData>;
  onSubmit: (values: ItemFormData) => Promise<Item>;
}

export function useItemForm({ mode, initialData = {}, onSubmit }: UseItemFormOptions) {
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

  const applyAiMetadata = (meta: ItemAiMetadata) => {
    setValues((v) => ({
      ...v,
      aiMetadata: meta,
      title: meta.suggestedTitle ?? v.title,
      category: meta.suggestedCategory ?? v.category,
      subcategory: meta.suggestedSubcategory ?? v.subcategory,
      tags: meta.suggestedTags ?? v.tags,
    }));
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

