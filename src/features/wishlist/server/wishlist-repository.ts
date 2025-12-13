// src/features/wishlist/server/wishlist-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type { WishlistItem, AddToWishlistInput } from "../types";

const mapRow = (row: any): WishlistItem => ({
  id: row.id,
  userId: row.user_id,
  itemId: row.item_id,
  createdAt: row.created_at,
});

export const wishlistRepository = {
  /**
   * Lista wishlist-ului pentru user
   */
  async list(userId: string): Promise<WishlistItem[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("wishlists")
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
   * Adaugă item în wishlist
   */
  async add(
    userId: string,
    input: AddToWishlistInput,
  ): Promise<WishlistItem> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: userId,
        item_id: input.itemId,
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
  async remove(userId: string, itemId: string): Promise<void> {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", userId)
      .eq("item_id", itemId);

    if (error) {
      console.error("[WISHLIST_REMOVE_ERROR]", error);
      throw new Error("Nu s-a putut elimina din wishlist.");
    }
  },
};