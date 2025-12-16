// src/features/items/validation.ts
import { z } from "zod";

/**
 * Condiții standard pentru item.
 * IMPORTANT: `item-form.tsx` importă `itemConditionValues` + `itemConditionLabels`.
 */
export const itemConditionValues = [
  "new",
  "like_new",
  "good",
  "fair",
  "poor",
] as const;

export const itemConditionLabels: Record<(typeof itemConditionValues)[number], string> = {
  new: "Nou",
  like_new: "Ca nou",
  good: "Bun",
  fair: "Acceptabil",
  poor: "Slab",
};

/**
 * Schema pentru imaginile item-ului (folosită în mai multe locuri).
 */
export const itemImageSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().min(1).optional(),
});

/**
 * Schema principală pentru formular.
 * NOTE: păstrez câmpurile “clasice” din proiectul tău; dacă ai ceva în plus,
 * TypeScript îți va spune la următorul build.
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

  // AI metadata (optional)
  aiMetadata: z.any().optional(),
});
