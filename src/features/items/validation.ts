// src/features/items/validation.ts

import { z } from "zod";

/**
 * Condiții standard pentru item.
 * Le ținem stabilizate aici ca "single source of truth" pentru UI + API.
 */
export const itemConditionValues = [
  "new",
  "like_new",
  "good",
  "fair",
  "poor",
] as const;

export const itemConditionLabels: Record<
  (typeof itemConditionValues)[number],
  string
> = {
  new: "Nou",
  like_new: "Ca nou",
  good: "Bun",
  fair: "Acceptabil",
  poor: "Slab",
};

/**
 * Schema pentru imaginile item-ului.
 *
 * Compatibilitate:
 * - forma nouă: { id, url, width?, height?, format?, isPrimary? }
 * - forma veche (din proiect): { url, publicId? }
 *
 * Normalizarea de mai jos va converti forma veche în forma nouă.
 */
const itemImageNewSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  format: z.string().min(1).optional(),
  isPrimary: z.boolean().optional(),
});

const itemImageLegacySchema = z.object({
  url: z.string().min(1), // uneori era doar string non-empty
  publicId: z.string().min(1).optional(),
});

export const itemImageSchema = z.union([itemImageNewSchema, itemImageLegacySchema]);

/**
 * Schema AI metadata (opțională).
 * Păstrăm un "raw" ca fallback ca să nu rupem build-ul dacă modelul se schimbă.
 */
export const itemAiMetadataSchema = z
  .object({
    detectedTitle: z.string().min(1).optional(),
    detectedCategory: z.string().min(1).optional(),
    detectedSubcategory: z.string().min(1).optional(),
    confidence: z.number().min(0).max(1).optional(),
    raw: z.record(z.unknown()).optional(),
  })
  .optional();

/**
 * Schema pentru CREATE (API / server).
 */
export const itemCreateSchema = z.object({
  title: z.string().trim().min(2, "Titlul este prea scurt").max(80),
  description: z.string().trim().min(10, "Descrierea este prea scurtă").max(2000),

  category: z.string().trim().min(2).max(50),
  subcategory: z.string().trim().min(2).max(50).optional(),

  tags: z.array(z.string().trim().min(1).max(30)).max(20).optional(),

  condition: z.enum(itemConditionValues),

  locationCity: z.string().trim().min(2).max(80),
  locationCountry: z.string().trim().min(2).max(80),

  approximateValue: z.number().nonnegative().finite().optional(),
  currency: z.string().trim().min(1).max(10).optional(),

  images: z.array(itemImageSchema).max(10).optional(),

  aiMetadata: itemAiMetadataSchema,
});

/**
 * Schema pentru UPDATE (API / server) — partial.
 */
export const itemUpdateSchema = itemCreateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

/**
 * Schema pentru FORM (client).
 * Păstrăm compatibilitatea cu ce aveai: multe câmpuri optional+default.
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

  aiMetadata: itemAiMetadataSchema,
});

/**
 * Tipuri derivate din Zod (sunt "contracte" stabile).
 */
export type ItemCreateData = z.infer<typeof itemCreateSchema>;
export type ItemUpdateData = z.infer<typeof itemUpdateSchema>;
export type ItemFormData = z.infer<typeof itemFormSchema>;

/**
 * ✅ Normalizer folosit de server/actions:
 * - taie whitespace
 * - convertește null -> undefined unde are sens
 * - garantează arrays
 * - normalizează imaginile la forma nouă {id,url,...}
 */
export function normalizeItemFormData(input: ItemFormData): ItemFormData {
  const images = Array.isArray(input.images) ? input.images : [];

  const normalizedImages = images
    .map((img) => {
      // forma nouă
      if ("id" in img && typeof img.id === "string") {
        return img;
      }

      // forma veche
      const url = typeof img.url === "string" ? img.url : "";
      const publicId =
        "publicId" in img && typeof img.publicId === "string" ? img.publicId : undefined;

      // id stabil: prefer publicId, altfel url (ca fallback determinist)
      const id = (publicId ?? url).trim();

      if (!id || !url) return null;

      // convertim în forma nouă
      return {
        id,
        url: url.trim(),
      };
    })
    .filter((x): x is z.infer<typeof itemImageNewSchema> => Boolean(x));

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
      (input.approximateValue as unknown) === null ? undefined : input.approximateValue,

    currency: (input.currency as unknown) === null ? undefined : input.currency,

    images: normalizedImages,

    aiMetadata: input.aiMetadata,
  };
}
