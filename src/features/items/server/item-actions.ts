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
  deleteItem,
} from "./item-repository";

/**
 * Actions = business logic.
 * Aici:
 * - validăm inputul (Zod)
 * - normalizăm datele
 * - apelăm repository
 *
 * IMPORTANT:
 * - Nu importăm ItemCreateInput / ItemUpdateInput deoarece în proiectul tău NU sunt exportate din ../types
 * - Tipul real al inputului e dat de Zod schema (validation.ts)
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

/**
 * DELETE (hard) — păstrat intern pentru cleanup/admin.
 * UI/API normal folosește soft-delete via updateItemAction({ isActive: false }).
 */
export async function deleteItemAction(
  supabase: SupabaseClient,
  itemId: string
): Promise<{ ok: true }> {
  return deleteItem(supabase, itemId);
}
