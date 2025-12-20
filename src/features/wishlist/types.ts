// src/features/wishlist/types.ts

/**
 * Wishlist = “salvat pentru mai târziu”.
 * Conceptual: user-ul salvează un item (al lui sau al altcuiva) ca favorit / de urmărit.
 */

export type WishlistEntry = {
  id: string;
  userId: string;
  category: string | null;
  subcategory?: string | null;
  brand: string | null;
  condition: string | null;
  priceMin: number | null;
  priceMax: number | null;
  createdAt: string;
};

export type AddToWishlistInput = {
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
