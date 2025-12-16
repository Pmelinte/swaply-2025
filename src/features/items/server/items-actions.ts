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
 * Repo-ul tău nu expune getItem, deci îl luăm direct din DB.
 */
export async function getItemAction(itemId: string): Promise<Item | null> {
  const userId = await requireUserId();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as Item;
}

/**
 * ✅ Create: insert direct în Supabase (repo-ul tău nu are createItem)
 */
export async function createItemAction(rawFormData: unknown): Promise<Item> {
  const userId = await requireUserId();
  const supabase = createServerClient();

  const parsed = itemFormSchema.safeParse(rawFormData);
  if (!parsed.success) {
    throw new Error("invalid_item_form_data");
  }

  const form: ItemFormData = normalizeItemFormData(
    parsed.data as unknown as ItemFormData,
  );

  // map form -> DB row (snake_case unde e cazul)
  const payload: any = {
    user_id: userId,
    title: form.title,
    description: form.description,

    category: form.category,
    subcategory: form.subcategory,
    tags: form.tags,

    condition: form.condition,

    location_city: form.locationCity,
    location_country: form.locationCountry,

    approximate_value: form.approximateValue,
    currency: form.currency,

    images: form.images,
    ai_metadata: form.aiMetadata,
  };

  const { data, error } = await supabase
    .from("items")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    console.error("createItemAction insert error:", error);
    throw new Error("Nu am putut crea item-ul.");
  }

  revalidatePath("/items");
  revalidatePath("/my/items");
  return data as Item;
}

/**
 * ✅ Update: folosește repo-ul existent (updateItem(itemId, updates))
 */
export async function updateItemAction(
  itemId: string,
  rawFormData: unknown,
): Promise<Item> {
  await requireUserId(); // doar pentru auth; repo-ul poate avea propriile checks
  const parsed = itemFormSchema.safeParse(rawFormData);
  if (!parsed.success) {
    throw new Error("invalid_item_form_data");
  }

  const form: ItemFormData = normalizeItemFormData(
    parsed.data as unknown as ItemFormData,
  );

  // repo-ul tău primește Partial<Item>
  const updates: Partial<Item> = {
    title: form.title,
    description: form.description,
    // restul câmpurilor pot exista sau nu în type Item; păstrăm “safe”
    ...(form as any),
  };

  const item = await itemsRepository.updateItem(itemId, updates);

  revalidatePath("/items");
  revalidatePath("/my/items");
  revalidatePath(`/items/${itemId}`);
  return item as unknown as Item;
}

/**
 * ✅ Export cerut de ItemRowActions.tsx
 * Repo-ul tău are deja archiveItem / deleteItem.
 */
export async function archiveItemAction(itemId: string): Promise<{ ok: true }> {
  await requireUserId();
  await itemsRepository.archiveItem(itemId);

  revalidatePath("/items");
  revalidatePath("/my/items");
  return { ok: true };
}

export async function deleteItemAction(itemId: string): Promise<{ ok: true }> {
  await requireUserId();
  await itemsRepository.deleteItem(itemId);

  revalidatePath("/items");
  revalidatePath("/my/items");
  return { ok: true };
}
