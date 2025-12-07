// src/features/items/server/items-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { normalizeItemFormData } from "../../items/validation";
import { itemsRepository } from "./items-repository";
import type { Item, ItemFormData } from "../../items/types";

/**
 * Returneaza user-ul autentificat sau arunca eroare
 */
async function requireUserId(): Promise<string> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return user.id;
}

/**
 * Creeaza un item nou
 */
export async function createItemAction(rawFormData: unknown): Promise<Item> {
  const userId = await requireUserId();
  const form: ItemFormData = normalizeItemFormData(rawFormData);

  const item = await itemsRepository.createItem(form, userId);

  // Revalidam paginile unde apar itemele
  revalidatePath("/my/items");
  revalidatePath("/");

  return item;
}

/**
 * Actualizare item existent
 */
export async function updateItemAction(
  itemId: string,
  rawFormData: unknown,
): Promise<Item> {
  const userId = await requireUserId();
  const form: ItemFormData = normalizeItemFormData(rawFormData);

  const updated = await itemsRepository.updateItem(itemId, form, userId);

  revalidatePath(`/items/${itemId}`);
  revalidatePath("/my/items");

  return updated;
}

/**
 * Arhivare item
 */
export async function archiveItemAction(itemId: string): Promise<void> {
  const userId = await requireUserId();
  await itemsRepository.archiveItem(itemId, userId);

  revalidatePath("/my/items");
  revalidatePath(`/items/${itemId}`);
}

/**
 * Returneaza un item (fără autentificare — pentru pagini publice)
 */
export async function getItemAction(itemId: string): Promise<Item | null> {
  return itemsRepository.getItemById(itemId);
}

/**
 * Lista obiecte user (autentificat)
 */
export async function listUserItemsAction(): Promise<Item[]> {
  const userId = await requireUserId();
  return itemsRepository.listUserItems(userId);
}
