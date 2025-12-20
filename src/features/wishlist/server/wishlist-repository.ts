// src/features/wishlist/server/wishlist-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type { WishlistEntry, AddToWishlistInput } from "../types";

const mapRow = (row: any): WishlistEntry => ({
  id: row.id,
  userId: row.user_id,
  category: row.category ?? null,
  subcategory: row.subcategory ?? null,
  brand: row.brand ?? null,
  condition: row.condition ?? null,
  priceMin: row.price_min ?? null,
  priceMax: row.price_max ?? null,
  createdAt: row.created_at,
});

export const wishlistRepository = {
  /**
   * Lista wishlist-ului pentru user
   */
  async list(userId: string): Promise<WishlistEntry[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[WISHLIST_LIST_ERROR]", error);
      throw new Error("Nu s-a putut încărca wishlist-ul.");
    }

    return (data ?? []).map(mapRow);
  },

  /**
   * Adaugă item în wishlist (idempotent — evită duplicate)
   */
  async add(userId: string, input: AddToWishlistInput): Promise<WishlistEntry> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("wishlist")
      .insert({
        user_id: userId,
        category: input.category ?? null,
        subcategory: input.subcategory ?? null,
        brand: input.brand ?? null,
        condition: input.condition ?? null,
        price_min: input.priceMin ?? null,
        price_max: input.priceMax ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[WISHLIST_ADD_ERROR]", error);
      throw new Error("Nu s-a putut adăuga în wishlist.");
    }

    return mapRow(data);
  },

  /**
   * Șterge item din wishlist
   */
  async remove(userId: string, id: string): Promise<void> {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);

    if (error) {
      console.error("[WISHLIST_REMOVE_ERROR]", error);
      throw new Error("Nu s-a putut elimina din wishlist.");
    }
  },
};
