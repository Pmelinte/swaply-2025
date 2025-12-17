// src/features/items/server/item-repository.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "../types";

/**
 * Repository = stratul care vorbește cu DB.
 *
 * IMPORTANT:
 * - Nu importăm ItemCreateInput / ItemUpdateInput (evităm blocaje de export).
 * - Contractul real al inputului e dat de Zod (validation.ts) + normalizare.
 */

function mapRowToItem(row: any): Item {
  return {
    id: row.id,
    ownerId: row.owner_id,

    title: row.title ?? "",
    description: row.description ?? "",

    category: row.category ?? "",
    subcategory: row.subcategory ?? undefined,

    tags: Array.isArray(row.tags) ? row.tags : [],

    condition: row.condition,

    locationCity: row.location_city ?? "",
    locationCountry: row.location_country ?? "",

    approximateValue:
      typeof row.approximate_value === "number" ? row.approximate_value : undefined,
    currency: row.currency ?? undefined,

    images: Array.isArray(row.images) ? row.images : [],

    aiMetadata: row.ai_metadata ?? undefined,

    isActive: Boolean(row.is_active),

    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  } as any;
}

function mapCreateToInsert(input: any) {
  return {
    // owner_id vine din DEFAULT auth.uid()
    title: input.title,
    description: input.description,

    category: input.category,
    subcategory: input.subcategory ?? null,

    tags: input.tags ?? [],

    condition: input.condition,

    location_city: input.locationCity,
    location_country: input.locationCountry,

    approximate_value:
      typeof input.approximateValue === "number" ? input.approximateValue : null,
    currency: input.currency ?? null,

    images: input.images ?? [],

    ai_metadata: input.aiMetadata ?? null,

    is_active: typeof input.isActive === "boolean" ? input.isActive : true,
  };
}

function mapUpdateToPatch(input: any) {
  const patch: Record<string, unknown> = {};

  if (typeof input.title === "string") patch.title = input.title;
  if (typeof input.description === "string") patch.description = input.description;

  if (typeof input.category === "string") patch.category = input.category;

  if (input.subcategory === undefined) {
    // nu atingem
  } else if (input.subcategory === null) {
    patch.subcategory = null;
  } else if (typeof input.subcategory === "string") {
    patch.subcategory = input.subcategory;
  }

  if (Array.isArray(input.tags)) patch.tags = input.tags;

  if (typeof input.condition === "string") patch.condition = input.condition;

  if (typeof input.locationCity === "string") patch
