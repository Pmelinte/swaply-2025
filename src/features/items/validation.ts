// src/features/items/validation.ts
import { z } from "zod";
import type { ItemFormData } from "./types";

/**
 * Condiții standard pentru item.
 *
 * IMPORTANT:
 * Din erorile tale TypeScript reiese că tipul `ItemCondition` din proiect
 * NU include "fair" și NU include "poor".
 */
export const itemConditionValues = ["new", "like_new", "good"] as const;

export const itemConditionLabels: Record<
  (typeof itemConditionValues)[number],
  string
> = {
  new: "Nou",
  like_new: "Ca nou",
  good: "Bun",
};

/**
 * Schema pentru imaginile item-ului.
 */
export const itemImageSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().min(1).optional(),
});

/**
 * Schema principală pentru formular.
 */
export const itemFormSchema = z.object({
  title: z.string().min(1, "Titlul este obligatoriu"),
  description: z.string().optional().default(""),

  category: z.string().optional().default(""),
  subcategory: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),

  condition: z.enum(itemConditionValues).optional().default("good"),

  locationCity: z.string().optional().default(""),
  locationCountry: z.string().optional().default(""),

  approximateValue: z.number().optional(),
  currency: z.string().optional(),

  images: z.array(itemImageSchema).optional().default([]),

  aiMetadata: z.any().optional(),
});

/**
 * ✅ Normalizer cerut de `items-actions.ts`
 * - convertește null -> undefined unde e nevoie
 * - taie whitespace
 * - garantează arrays
 */
export function normalizeItemFormData(input: ItemFormData): ItemFormData {
  return {
    ...input,
    title: (input.title ?? "").trim(),
    description: (input.description ?? "").trim(),

    category: (input.category ?? "").trim(),
    subcategory: (input.subcategory ?? "").trim(),

    tags: Array.isArray(input.tags) ? input.tags : [],

    locationCity: (input.locationCity ?? "").trim(),
    locationCountry: (input.locationCountry ?? "").trim(),

    approximateValue:
      input.approximateValue === null ? undefined : input.approximateValue,

    currency: input.currency === null ? undefined : input.currency,

    images: Array.isArray(input.images) ? input.images : [],

    aiMetadata: input.aiMetadata,
  };
}
