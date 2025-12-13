// src/features/wishlist/types.ts

/**
 * Wishlist = “salvat pentru mai târziu”.
 * Conceptual: user-ul salvează un item (al lui sau al altcuiva) ca favorit / de urmărit.
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

export type WishlistItemPreview = {
  id: string;
  itemId: string;
  title: string | null;
  primaryImageUrl: string | null;
  createdAt: string;
};

export type WishlistApiResponse =
  | { ok: true; entries?: WishlistEntry[]; items?: WishlistItemPreview[] }
  | { ok: false; error: string };