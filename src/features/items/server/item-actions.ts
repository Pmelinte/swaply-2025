// src/features/items/server/item-actions.ts

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  itemFormSchema,
  normalizeItemFormData,
} from "../validation";

import type { Item, ItemFormData } from "../types";

import {
  createItem,
  updateItem,
  getItemById,
  listMyItems,
  deleteItem,
} from "./item-repository";

/**
 * Actions = business logic.
 * - validare (Zod)
 * - normalizare
 * - repository
 */

/**
 * CREATE
 * ownerId rămâne param pentru compat (chiar dacă DB poate avea DEFAULT auth.uid()).
 */
export async function createItemAction(
  supabase: SupabaseClient,
  ownerId: string,
  rawInput: unknown
): Promise<Item> {
  const parsed = itemFormSchema.parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any) as ItemFormData;

  // dacă repository-ul nu folosește ownerId, îl ignoră; îl păstrăm pt compat
  return createItem(supabase, { ...normalized, ownerId });
}

/**
 * UPDATE
 */
export async function updateItemAction(
  supabase: SupabaseClient,
  itemId: string,
  rawInput: unknown
): Promise<Item> {
  const parsed = itemFormSchema.partial().parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any);

  return updateItem(supabase, itemId, normalized);
}

/**
 * READ (single)
 */
export async function getItemAction(
  supabase: SupabaseClient,
  itemId: string
): Promise<Item | null> {
  return getItemById(supabase, itemId);
}

/**
 * READ (list my items)
 */
export async function listMyItemsAction(
  supabase: SupabaseClient,
  ownerId: string,
  options?: {
    limit?: number;
    offset?: number;
    onlyActive?: boolean;
  }
): Promise<Item[]> {
  return listMyItems(supabase, ownerId, options);
}

/**
 * DELETE (hard)
 */
export async function deleteItemAction(
  supabase: SupabaseClient,
  itemId: string
): Promise<{ ok: true }> {
  return deleteItem(supabase, itemId);
}
