// src/features/items/validation.ts

import { z } from "zod";
import type {
  ItemCondition,
  ItemFormData,
  ItemImage,
  ItemAiMetadata,
} from "./types";

// ---------------------------------------------------------
// 1. Condiția obiectului – valori + etichete pentru UI
// ---------------------------------------------------------

export const itemConditionValues: ItemCondition[] = [
  "new",
  "like_new",
  "very_good",
  "good",
  "acceptable",
];

export const itemConditionLabels: Record<ItemCondition, string> = {
  new: "Nou, nefolosit",
  like_new: "Ca nou",
  very_good: "Foarte bun",
  good: "Bun",
  acceptable: "Acceptabil",
};

// Schema de validare pentru condiție
const itemConditionSchema = z.enum(itemConditionValues);

// ---------------------------------------------------------
// 2. Schemas pentru imagini și metadata AI
// ---------------------------------------------------------

export const itemImageSchema: z.ZodType<ItemImage> = z.object({
  id: z.string().uuid().optional(),
  url: z
    .string({
      required_error: "Imaginea trebuie să aibă un URL.",
    })
    .url("URL-ul imaginii nu este valid."),
  publicId: z.string().optional(),
  isPrimary: z.boolean().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().optional(),
});

export const itemAiMetadataSchema: z.ZodType<ItemAiMetadata> = z.object({
  model: z.string().optional(),
  primaryLabel: z.string().optional(),
  confidence: z
    .number()
    .min(0, "Scorul de încredere nu poate fi negativ.")
    .max(1, "Scorul de încredere nu poate fi mai mare de 1.")
    .optional(),
  alternativeLabels: z.array(z.string()).optional(),
  suggestedTitle: z.string().optional(),
  suggestedCategory: z.string().optional(),
  suggestedSubcategory: z.string().optional(),
  suggestedTags: z.array(z.string()).optional(),
  source: z
    .enum(["image_classification", "text_classification", "hybrid"])
    .optional(),
});

// ---------------------------------------------------------
// 3. Schema principală pentru formular (Add / Edit Item)
// ---------------------------------------------------------

export const itemFormSchema = z.object({
  title: z
    .string({
      required_error: "Titlul este obligatoriu.",
    })
    .min(3, "Titlul trebuie să aibă cel puțin 3 caractere.")
    .max(120, "Titlul nu poate depăși 120 de caractere.")
    .transform((v) => v.trim()),

  description: z
    .string({
      required_error: "Descrierea este obligatorie.",
    })
    .min(10, "Descrierea trebuie să aibă cel puțin 10 caractere.")
    .max(3000, "Descrierea nu poate depăși 3000 de caractere.")
    .transform((v) => v.trim()),

  category: z
    .string({
      required_error: "Categoria este obligatorie.",
    })
    .min(2, "Categoria este prea scurtă.")
    .max(80, "Categoria este prea lungă.")
    .transform((v) => v.trim()),

  subcategory: z
    .string()
    .min(2, "Subcategoria este prea scurtă.")
    .max(80, "Subcategoria este prea lungă.")
    .optional()
    // permitem "" din UI și îl transformăm în undefined
    .or(z.literal("").transform(() => undefined)),

  tags: z
    .array(
      z
        .string()
        .min(1, "Eticheta nu poate fi goală.")
        .max(40, "Eticheta nu poate depăși 40 de caractere."),
    )
    .max(20, "Poți avea cel mult 20 de etichete.")
    .default([]),

  condition: itemConditionSchema,

  locationCity: z
    .string()
    .min(2, "Numele orașului este prea scurt.")
    .max(80, "Numele orașului este prea lung.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  locationCountry: z
    .string()
    .min(2, "Țara este prea scurtă.")
    .max(80, "Țara este prea lungă.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  approximateValue: z
    .number()
    .nonnegative("Valoarea nu poate fi negativă.")
    .max(1_000_000_000, "Valoarea este prea mare.")
    .optional(),

  currency: z
    .string()
    .min(1, "Moneda este prea scurtă.")
    .max(10, "Moneda este prea lungă.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  images: z
    .array(itemImageSchema)
    .min(1, "Trebuie să adaugi cel puțin o imagine.")
    .default([]),

  aiMetadata: itemAiMetadataSchema.optional(),
});

export type ItemFormSchema = z.infer<typeof itemFormSchema>;

// ---------------------------------------------------------
// 4. Normalizare pentru server actions
// ---------------------------------------------------------

/**
 * Normalizează și validează orice vine din formulare (Add / Edit),
 * astfel încât pe server să lucrăm mereu cu un `ItemFormData` curat.
 */
export function normalizeItemFormData(raw: unknown): ItemFormData {
  const parsed = itemFormSchema.parse(raw);

  return {
    title: parsed.title,
    description: parsed.description,
    category: parsed.category,
    subcategory: parsed.subcategory,
    tags: parsed.tags ?? [],
    condition: parsed.condition as ItemCondition,
    locationCity: parsed.locationCity,
    locationCountry: parsed.locationCountry,
    approximateValue: parsed.approximateValue,
    currency: parsed.currency,
    images: parsed.images as ItemImage[],
    aiMetadata: parsed.aiMetadata as ItemAiMetadata | undefined,
  };
}
