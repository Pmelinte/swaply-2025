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
 * ✅ Compat layer pentru cod vechi.
 *
 * Avem două stiluri de folosire în proiect:
 * 1) unele fișiere importă ACTIONS:
 *    - createItemAction / updateItemAction / getItemAction ...
 * 2) altele folosesc helper-ele server-side de aici:
 *    - createItemServer / updateItemServer / getItemServer ...
 *
 * Ca să nu rupem build-ul, acest fișier exportă AMBELE.
 */

// ✅ Re-export ACTIONS pentru importurile vechi (ex: edit/page.tsx)
export {
  createItemAction,
  updateItemAction,
  getItemAction,
  listMyItemsAction,
  deleteItemAction,
};

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

// ✅ Helper-e server-side (păstrăm ce aveai deja)
export async function createItemServer(rawInput: unknown): Promise<Item> {
  const { supabase, userId } = await requireUser();

  const parsed = itemFormSchema.parse(rawInput);
  const normalized = normalizeItemFormData(parsed as any) as ItemFormData;

  return createItemAction(supabase, userId, normalized);
}

export async function updateItemServer(
  itemId: string,
  rawInput: unknown
): Promise<Item> {
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

export async function deleteItemServer(
  itemId: string
): Promise<{ ok: true }> {
  const { supabase } = await requireUser();
  return deleteItemAction(supabase, itemId);
}
