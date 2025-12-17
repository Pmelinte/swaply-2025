// src/features/items/server/item-repository.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item } from "../types";

/**
 * Repository = strat DB.
 *
 * IMPORTANT:
 * - Evităm tipuri de input în semnături (ItemCreateInput/ItemUpdateInput),
 *   ca să nu rupem build-ul când contractele evoluează.
 * - Contractul de validare e în Zod (validation.ts) + normalizeItemFormData.
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

    condition: row.condition ?? "good",

    status: row.status ?? undefined,

    locationCity: row.location_city ?? "",
    locationCountry: row.location_country ?? "",

    approximateValue:
      typeof row.approximate_value === "number" ? row.approximate_value : undefined,
    currency: row.currency ?? undefined,

    images: Array.isArray(row.images) ? row.images : [],

    aiMetadata: row.ai_metadata ?? undefined,

    isActive: typeof row.is_active === "boolean" ? row.is_active : undefined,

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

    status: input.status ?? null,

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

  if (typeof input.status === "string") patch.status = input.status;
  if (input.status === null) patch.status = null;

  if (typeof input.locationCity === "string") patch.location_city = input.locationCity;
  if (typeof input.locationCountry === "string")
    patch.location_country = input.locationCountry;

  if (input.approximateValue === undefined) {
    // nu atingem
  } else if (input.approximateValue === null) {
    patch.approximate_value = null;
  } else if (typeof input.approximateValue === "number") {
    patch.approximate_value = input.approximateValue;
  }

  if (input.currency === undefined) {
    // nu atingem
  } else if (input.currency === null) {
    patch.currency = null;
  } else if (typeof input.currency === "string") {
    patch.currency = input.currency;
  }

  if (Array.isArray(input.images)) patch.images = input.images;

  if (typeof input.aiMetadata !== "undefined") patch.ai_metadata = input.aiMetadata ?? null;

  if (typeof input.isActive === "boolean") patch.is_active = input.isActive;

  return patch;
}

export async function createItem(supabase: SupabaseClient, input: any): Promise<Item> {
  const insert = mapCreateToInsert(input);

  const { data, error } = await supabase.from("items").insert(insert).select("*").single();

  if (error) throw new Error(`createItem failed: ${error.message}`);
  return mapRowToItem(data);
}

export async function updateItem(
  supabase: SupabaseClient,
  id: string,
  input: any
): Promise<Item> {
  const patch = mapUpdateToPatch(input);

  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`updateItem failed: ${error.message}`);
  return mapRowToItem(data);
}

export async function getItemById(
  supabase: SupabaseClient,
  id: string
): Promise<Item | null> {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getItemById failed: ${error.message}`);
  if (!data) return null;

  return mapRowToItem(data);
}

export async function listMyItems(
  supabase: SupabaseClient,
  ownerId: string,
  options?: { limit?: number; offset?: number; onlyActive?: boolean }
): Promise<Item[]> {
  const limit = options?.limit ?? 30;
  const offset = options?.offset ?? 0;

  let query = supabase
    .from("items")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.onlyActive) query = query.eq("is_active", true);

  const { data, error } = await query;

  if (error) throw new Error(`listMyItems failed: ${error.message}`);
  return (data ?? []).map(mapRowToItem);
}
