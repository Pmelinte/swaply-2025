// src/features/items/server/item-actions.ts

import type { SupabaseClient } from "@supabase/supabase-js";

import { itemFormSchema, normalizeItemFormData } from "../validation";
import type { Item, ItemFormData } from "../types";

import {
  createItem,
  updateItem,
  getItemById,
  listMyItems,
  deleteItem,
} from "./item-repository";

/**
 * Actions = business logic (validare + normalizare + repo)
 *
 * IMPORTANT:
 * - Exportăm explicit toate funcțiile folosite în API routes.
 * - Validarea se face aici (Zod), nu în repository.
 */

export async function createItemAction(
  supabase: SupabaseClient,
  ownerId: string,
  rawInput: unknown
): Promise<Item> {
  const parsed = itemFormSchema.parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any) as ItemFormData;

  // ownerId e păstrat pentru compat cu call sites; repo poate ignora
  return createItem(supabase, { ...normalized, ownerId });
}

export async function updateItemAction(
  supabase: SupabaseClient,
  itemId: string,
  rawInput: unknown
): Promise<Item> {
  const parsed = itemFormSchema.partial().parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any);

  return updateItem(supabase, itemId, normalized);
}

export async function getItemAction(
  supabase: SupabaseClient,
  itemId: string
): Promise<Item | null> {
  return getItemById(supabase, itemId);
}

export async function listMyItemsAction(
  supabase: SupabaseClient,
  ownerId: string,
  options?: { limit?: number; offset?: number; onlyActive?: boolean }
): Promise<Item[]> {
  return listMyItems(supabase, ownerId, options);
}

export async function deleteItemAction(
  supabase: SupabaseClient,
  itemId: string
): Promise<{ ok: true }> {
  return deleteItem(supabase, itemId);
}
