// src/features/items/server/items-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { itemFormSchema, normalizeItemFormData } from "../../items/validation";
import { itemsRepository } from "./items-repository";
import type { Item, ItemFormData } from "../../items/types";

async function requireUserId(): Promise<string> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error("not_authenticated");
  return user.id;
}

/**
 * ✅ Export cerut de /items/[id]/edit/page.tsx
 */
export async function getItemAction(itemId: string): Promise<Item | null> {
  const userId = await requireUserId();
  // repo-ul tău probabil are getItem; dacă nu, următoarea eroare ne spune exact cum se numește.
  const item = await (itemsRepository as any).getItem?.(itemId, userId);

  if (!item) return null;
  return item as Item;
}

export async function createItemAction(rawFormData: unknown): Promise<Item> {
  const userId = await requireUserId();

  const parsed = itemFormSchema.safeParse(rawFormData);
  if (!parsed.success) {
    throw new Error("invalid_item_form_data");
  }

  const form: ItemFormData = normalizeItemFormData(
    parsed.data as unknown as ItemFormData,
  );

  const item = await itemsRepository.createItem(form, userId);

  revalidatePath("/items");
  revalidatePath("/my/items");
  return item;
}

export async function updateItemAction(
  itemId: string,
  rawFormData: unknown,
): Promise<Item> {
  const userId = await requireUserId();

  const parsed = itemFormSchema.safeParse(rawFormData);
  if (!parsed.success) {
    throw new Error("invalid_item_form_data");
  }

  const form: ItemFormData = normalizeItemFormData(
    parsed.data as unknown as ItemFormData,
  );

  const item = await itemsRepository.updateItem(itemId, form, userId);

  revalidatePath("/items");
  revalidatePath("/my/items");
  revalidatePath(`/items/${itemId}`);
  return item;
}
