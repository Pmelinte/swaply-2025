// src/features/items/validation.ts

import { z } from "zod";
import type { ItemCondition, ItemFormData } from "./types";

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

const itemConditionSchema = z.enum([
  "new",
  "like_new",
  "very_good",
  "good",
  "acceptable",
]);

const itemImageSchema = z.object({
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

const itemAiMetadataSchema = z.object({
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
  source: z.enum(["image_classification", "text_classification", "hybrid"]).optional(),
});

// Schema pentru formularul de adăugare / editare obiect
export const itemFormSchema = z
  .object({
    title: z
      .string({
        required_error: "Titlul este obligatoriu.",
      })
      .min(3, "Titlul trebuie să aibă cel puțin 3 caractere.")
      .max(120, "Titlul nu poate depăși 120 de caractere."),

    description: z
      .string({
        required_error: "Descrierea este obligatorie.",
      })
      .min(10, "Descrierea trebuie să aibă cel puțin 10 caractere.")
      .max(3000, "Descrierea nu poate depăși 3000 de caractere."),

    category: z
      .string({
        required_error: "Categoria este obligatorie.",
      })
      .min(2, "Categoria este prea scurtă.")
      .max(80, "Categoria este prea lungă."),

    subcategory: z
      .string()
      .min(2, "Subcategoria este prea scurtă.")
      .max(80, "Subcategoria este prea lungă.")
      .optional()
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
