// src/features/items/validation.ts
import { z } from "zod";

/**
 * Condiții standard pentru item.
 *
 * IMPORTANT:
 * În proiectul tău, tipul `ItemCondition` NU include "fair" (TypeScript ți-a zis clar).
 * Ca să nu mai generăm un payload invalid, eliminăm "fair" din lista permisă.
 */
export const itemConditionValues = [
  "new",
  "like_new",
  "good",
  "poor",
] as const;

export const itemConditionLabels: Record<
  (typeof itemConditionValues)[number],
  string
> = {
  new: "Nou",
  like_new: "Ca nou",
  good: "Bun",
  poor: "Slab",
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
