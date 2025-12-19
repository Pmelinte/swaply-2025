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
 * Nu folosim itemsRepository (nu există).
 * Folosim item-actions + Supabase server client.
 */

async function requireUser() {
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
  const { supabase, userId } = await requireUser();

  const parsed = itemFormSchema.parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any) as ItemFormData;

  // ✅ IMPORTANT: trimitem ownerId explicit ca să treacă RLS fără “magie”
  return createItemAction(supabase, userId, { ...(normalized as any), ownerId: userId } as any);
}

export async function updateItemServer(itemId: string, rawInput: unknown): Promise<Item> {
  const { supabase } = await requireUser();

  const parsed = itemFormSchema.partial().parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any);

  return updateItemAction(supabase, itemId, normalized);
}

export async function getItemServer(itemId: string): Promise<Item | null> {
  const { supabase } = await requireUser();
  return getItemAction(supabase, itemId);
}

export async function listMyItemsServer(options?: {
  limit?: number;
  offset?: number;
  onlyActive?: boolean;
}): Promise<Item[]> {
  const { supabase, userId } = await requireUser();
  return listMyItemsAction(supabase, userId, options);
}

export async function deleteItemServer(itemId: string): Promise<{ ok: true }> {
  const { supabase } = await requireUser();
  return deleteItemAction(supabase, itemId);
}
