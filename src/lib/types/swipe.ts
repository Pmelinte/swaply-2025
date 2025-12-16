// src/lib/types/swipe.ts
/**
 * Tipuri pentru feed-ul de swipe.
 * Le ținem minimale și compatibile cu datele venite din Supabase/API.
 */

export type SwipeFeedItem = {
  id: string;

  /**
   * ID-ul sursă (de obicei ID-ul itemului din DB),
   * folosit în endpoint-uri pentru deduplicare / tracking.
   */
  sourceId?: string;

  // item fields (cele mai folosite în UI)
  title?: string | null;
  description?: string | null;

  // imagini (Cloudinary / URL)
  image_url?: string | null;
  imageUrl?: string | null; // compat

  // categorie (opțional)
  category_id?: string | null;
  subcategory_id?: string | null;

  // owner
  owner_id?: string | null;

  // meta
  created_at?: string | null;
};
