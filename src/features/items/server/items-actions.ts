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

/**
 * ✅ Export cerut de ItemRowActions.tsx
 *
 * Implementare “safe”:
 * - dacă ai coloană `archived`/`is_archived`/`status`, o actualizăm prin update direct.
 * - dacă nu există în DB, măcar nu crapă build-ul; runtime poate da error și îl vezi.
 */
export async function archiveItemAction(itemId: string): Promise<{ ok: true }> {
  const userId = await requireUserId();
  const supabase = createServerClient();

  // încercăm câteva variante uzuale de “archive”
  const attempts = [
    { archived: true },
    { is_archived: true },
    { status: "archived" },
    { is_active: false },
  ];

  let lastErr: any = null;

  for (const patch of attempts) {
    const { error } = await supabase
      .from("items")
      .update(patch as any)
      .eq("id", itemId)
      .eq("user_id", userId);

    if (!error) {
      revalidatePath("/items");
      revalidatePath("/my/items");
      return { ok: true };
    }

    lastErr = error;
  }

  console.error("archiveItemAction error:", lastErr);
  throw new Error("Nu am putut arhiva item-ul (schema DB nu corespunde).");
}

export async function deleteItemAction(itemId: string): Promise<{ ok: true }> {
  const userId = await requireUserId();
  const supabase = createServerClient();

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    console.error("deleteItemAction error:", error);
    throw new Error("Nu am putut șterge item-ul.");
  }

  revalidatePath("/items");
  revalidatePath("/my/items");
  return { ok: true };
}
