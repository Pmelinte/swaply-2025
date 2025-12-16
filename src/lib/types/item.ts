// src/lib/types/item.ts
/**
 * Tipuri pentru Item (obiect) folosite în UI + API.
 * Le ținem suficient de largi ca să nu blocheze build-ul dacă schema DB diferă.
 */

export type Item = {
  id: string;

  title?: string | null;
  description?: string | null;

  // categorii
  categoryId?: string | null;
  subcategoryId?: string | null;
  category_id?: string | null;      // compat DB
  subcategory_id?: string | null;   // compat DB

  // user/owner
  ownerId?: string | null;
  owner_id?: string | null;         // compat DB

  // imagini
  imageUrl?: string | null;
  image_url?: string | null;        // compat DB
  images?: string[] | null;

  // tags / meta
  tags?: string[] | null;
  condition?: string | null;
  location?: string | null;
  currency?: string | null;
  approximateValue?: number | null;

  created_at?: string | null;
  updated_at?: string | null;
};
