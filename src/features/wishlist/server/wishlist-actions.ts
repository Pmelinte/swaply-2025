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
 * Adaugă în wishlist (user curent) - wishlist pe criterii (nu pe itemId)
 */
export async function addToWishlistAction(
  input: AddToWishlistInput,
): Promise<WishlistEntry> {
  const userId = await requireUserId();

  const safe: AddToWishlistInput = {
    category: input?.category ?? null,
    subcategory: input?.subcategory ?? null,
    brand: input?.brand ?? null,
    condition: input?.condition ?? null,
    priceMin: input?.priceMin ?? null,
    priceMax: input?.priceMax ?? null,
  };

  // Validare minimă: să existe măcar un criteriu setat
  const hasAny =
    !!(safe.category && safe.category.trim()) ||
    !!(safe.subcategory && safe.subcategory.trim()) ||
    !!(safe.brand && safe.brand.trim()) ||
    !!(safe.condition && safe.condition.trim()) ||
    typeof safe.priceMin === "number" ||
    typeof safe.priceMax === "number";

  if (!hasAny) {
    throw new Error("missing_wishlist_criteria");
  }

  const entry = await wishlistRepository.add(userId, safe);

  revalidatePath("/wishlist");
  return entry;
}

/**
 * Elimină din wishlist (user curent) - ștergere după id-ul entry-ului
 */
export async function removeFromWishlistAction(id: string): Promise<void> {
  const userId = await requireUserId();

  if (!id || typeof id !== "string") {
    throw new Error("missing_id");
  }

  await wishlistRepository.remove(userId, id);

  revalidatePath("/wishlist");
}
