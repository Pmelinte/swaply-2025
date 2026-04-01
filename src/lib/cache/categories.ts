import "server-only";

import { unstable_cache } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * Fetch all subcategories for a given category slug.
 * Cached for 1 hour — subcategories change very rarely.
 */
export const getCachedSubcategories = unstable_cache(
  async (categorySlug: string) => {
    const supabase = getServiceSupabase();
    if (!supabase) return [];

    const { data } = await supabase
      .from("subcategories")
      .select("slug, name_ro, name_en, icon, sort_order, requires_disclaimer, disclaimer_key, extra_fields")
      .eq("category_slug", categorySlug)
      .order("sort_order", { ascending: true });

    return data ?? [];
  },
  ["subcategories"],
  { revalidate: 3600, tags: ["subcategories"] },
);

/**
 * Fetch a single subcategory's metadata by category + subcategory slug.
 * Cached for 1 hour.
 */
export const getCachedSubcategoryMeta = unstable_cache(
  async (categorySlug: string, subcatSlug: string) => {
    const supabase = getServiceSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from("subcategories")
      .select("name_en, name_ro, icon")
      .eq("category_slug", categorySlug)
      .eq("slug", subcatSlug)
      .maybeSingle();

    return data;
  },
  ["subcategory-meta"],
  { revalidate: 3600, tags: ["subcategories"] },
);

/**
 * Fetch SEO content for a city+category landing page.
 * Cached for 1 hour — SEO content is static.
 */
export const getCachedSeoContent = unstable_cache(
  async (citySlug: string, categorySlug: string) => {
    const supabase = getServiceSupabase();
    if (!supabase) return null;

    const { data } = await supabase
      .from("seo_content")
      .select("h1, intro_paragraph, meta_title, meta_description")
      .eq("page_type", "category_city")
      .eq("category_slug", categorySlug)
      .eq("city_slug", citySlug)
      .eq("lang", "en")
      .maybeSingle();

    return data;
  },
  ["seo-content"],
  { revalidate: 3600, tags: ["seo_content"] },
);
