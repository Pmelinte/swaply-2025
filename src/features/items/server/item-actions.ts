// src/features/items/server/items-actions.ts

import { createServerClient } from "@/lib/supabase/server";
import { itemFormSchema, normalizeItemFormData } from "../../items/validation";
import type { Item, ItemFormData } from "../../items/types";

import {
  createItemAction,
  updateItemAction,
  getItemAction,
  listMyItemsAction,
  deleteItemAction,
} from "./item-actions";

/**
 * ✅ Compat layer pentru codul vechi care importă din:
 *   src/features/items/server/items-actions.ts (cu "s")
 *
 * În loc să depindem de un "itemsRepository" (care nu există),
 * expunem funcții server-side care folosesc:
 * - createServerClient()
 * - auth.getUser()
 * - item-actions.ts (business logic)
 */

async function requireUserId(): Promise<{ supabase: ReturnType<typeof createServerClient>; userId: string }> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("not_authenticated");
  }

  return { supabase, userId: user.id };
}

export async function createItemServer(rawInput: unknown): Promise<Item> {
  const { supabase, userId } = await requireUserId();

  const parsed = itemFormSchema.parse(rawInput);
  const normalized = normalizeItemFormData(parsed as ItemFormData);

  // ownerId rămâne param pt compat; în DB poate veni din DEFAULT auth.uid()
  return createItemAction(supabase, userId, normalized);
}

export async function updateItemServer(itemId: string, rawInput: unknown): Promise<Item> {
  const { supabase } = await requireUserId();

  const parsed = itemFormSchema.partial().parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any);

  return updateItemAction(supabase, itemId, normalized);
}

export async function getItemServer(itemId: string): Promise<Item | null> {
  const { supabase } = await requireUserId();
  return getItemAction(supabase, itemId);
}

export async function listMyItemsServer(options?: { limit?: number; offset?: number; onlyActive?: boolean }): Promise<Item[]> {
  const { supabase, userId } = await requireUserId();
  return listMyItemsAction(supabase, userId, options);
}

export async function deleteItemServer(itemId: string): Promise<{ ok: true }> {
  const { supabase } = await requireUserId();
  return deleteItemAction(supabase, itemId);
}
