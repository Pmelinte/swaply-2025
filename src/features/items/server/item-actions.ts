// src/features/items/server/item-actions.ts

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  itemCreateSchema,
  itemUpdateSchema,
  normalizeItemFormData,
} from "../validation";

import type { Item } from "../types";

import {
  createItem,
  updateItem,
  getItemById,
  listMyItems,
} from "./item-repository";

/**
 * Actions = business logic.
 *
 * IMPORTANT:
 * - Nu importăm ItemCreateInput / ItemUpdateInput (nu sunt exportate din ../types).
 * - Soft-delete este standard (isActive=false) și se face în API by-id via updateItemAction.
 * - Hard-delete este dezactivat elegant (nu expunem delete action acum).
 */

/**
 * CREATE
 *
 * Notă:
 * - ownerId rămâne în semnătură doar pentru compatibilitate cu API-ul existent.
 * - Nu îl folosim: DB are DEFAULT auth.uid() + RLS care aplică ownership.
 */
export async function createItemAction(
  supabase: SupabaseClient,
  _ownerId: string,
  rawInput: unknown
): Promise<Item> {
  const parsed = itemCreateSchema.parse(rawInput);

  const normalized = normalizeItemFormData(parsed as any);

  return createItem(supabase, normalized as any);
}

/**
 * UPDATE
 */
export async function updateItemAction(
  supabase: SupabaseClient,
  itemId: string,
  rawInput: unknown
): Promise<Item> {
  const parsed = itemUpdateSchema.parse(rawInput);

  const normalized = normalizeItemFormData(parsed as any);

  return updateItem(supabase, itemId, normalized as any);
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
