// src/features/items/server/item-actions.ts

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  itemCreateSchema,
  itemUpdateSchema,
  normalizeItemFormData,
} from "../validation";

import type {
  Item,
  ItemCreateInput,
  ItemUpdateInput,
} from "../types";

import {
  createItem,
  updateItem,
  getItemById,
  listMyItems,
  deleteItem,
} from "./item-repository";

/**
 * Actions = business logic.
 * Aici:
 * - validăm inputul (Zod)
 * - normalizăm datele
 * - apelăm repository
 *
 * UI / API NU au voie să sară peste acest strat.
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

  const normalized = normalizeItemFormData(parsed as any) as ItemCreateInput;

  return createItem(supabase, normalized);
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

  const normalized = normalizeItemFormData(parsed as any) as ItemUpdateInput;

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
 * DELETE
 *
 * Observație:
 * momentan e delete hard.
 * Dacă vrei soft-delete (is_active=false),
 * schimbăm aici, nu în 5 locuri.
 */
export async function deleteItemAction(
  supabase: SupabaseClient,
  itemId: string
): Promise<{ ok: true }> {
  return deleteItem(supabase, itemId);
}
