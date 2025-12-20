// src/features/wishlist/types.ts

/**
 * Wishlist = “salvat pentru mai târziu”.
 * În acest proiect, “wishlist” înseamnă: user-ul salvează un ITEM (by id).
 * (Câmpurile de filtre rămân opționale pentru extensii viitoare, dar acum minimul necesar e itemId.)
 */

export type WishlistEntry = {
  id: string;
  userId: string;

  // item saved
  itemId: string;

  // optional metadata / future filters
  category: string | null;
  subcategory?: string | null;
  brand: string | null;
  condition: string | null;
  priceMin: number | null;
  priceMax: number | null;

  createdAt: string;
};

export type AddToWishlistInput = {
  // ✅ REQUIRED: asta folosește wishlist-actions.ts
  itemId: string;

  // opțional (pentru viitor / extensii)
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  condition?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
};

export type RemoveFromWishlistInput = {
  id: string;
};

export type WishlistApiResponse =
  | { ok: true; entries: WishlistEntry[] }
  | { ok: false; error: string };
