// src/features/wishlist/types.ts

/**
 * Wishlist = “salvat pentru mai târziu”.
 * User-ul salvează un item ca favorit / de urmărit.
 */

export type WishlistEntry = {
  id: string;
  userId: string;
  itemId: string;
  createdAt: string;
};

export type AddToWishlistInput = {
  itemId: string;
};

export type RemoveFromWishlistInput = {
  itemId: string;
};

export type WishlistApiResponse =
  | { ok: true; entries: WishlistEntry[] }
  | { ok: false; error: string };
