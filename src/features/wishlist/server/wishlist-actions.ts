// src/features/wishlist/server/wishlist-actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { wishlistRepository } from "./wishlist-repository";
import type { WishlistEntry, AddToWishlistInput } from "../types";

async function requireUserId(): Promise<string> {
  const supabase = createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("not_authenticated");
  }

  return user.id;
}

/**
 * Listează wishlist-ul userului curent
 */
export async function listWishlistAction(): Promise<WishlistEntry[]> {
  const userId = await requireUserId();
  return wishlistRepository.list(userId);
}

/**
 * Adaugă în wishlist (user curent)
 */
export async function addToWishlistAction(
  input: AddToWishlistInput,
): Promise<WishlistEntry> {
  const userId = await requireUserId();

  if (!input?.itemId || typeof input.itemId !== "string") {
    throw new Error("missing_item_id");
  }

  const entry = await wishlistRepository.add(userId, { itemId: input.itemId });

  // revalidăm pagini unde se vede wishlist-ul / item-ul
  revalidatePath("/wishlist");
  revalidatePath(`/items/${input.itemId}`);

  return entry;
}

/**
 * Elimină din wishlist (user curent)
 */
export async function removeFromWishlistAction(itemId: string): Promise<void> {
  const userId = await requireUserId();

  if (!itemId || typeof itemId !== "string") {
    throw new Error("missing_item_id");
  }

  await wishlistRepository.remove(userId, itemId);

  revalidatePath("/wishlist");
  revalidatePath(`/items/${itemId}`);
}