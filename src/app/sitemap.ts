import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getServiceSupabase } from "@/lib/supabase/service";

const BASE_URL = "https://www.swaply.world";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticHigh: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/info`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 1 },
  ];

  const staticMedium: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/safety`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/cookies`, changeFrequency: "monthly", priority: 0.8 },
  ];

  // Blog posts from MDX files
  const blogPosts: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Dynamic data from Supabase
  const supabase = getServiceSupabase();
  let cityPages: MetadataRoute.Sitemap = [];
  let categoryPages: MetadataRoute.Sitemap = [];
  let objectPages: MetadataRoute.Sitemap = [];

  if (supabase) {
    const [citiesResult, categoriesResult, itemsResult] = await Promise.all([
      supabase
        .from("items")
        .select("location")
        .eq("status", "active")
        .eq("is_active", true)
        .not("location", "is", null),
      supabase
        .from("items")
        .select("category")
        .eq("status", "active")
        .eq("is_active", true)
        .not("category", "is", null),
      supabase
        .from("items")
        .select("id, updated_at")
        .eq("status", "active")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(5000),
    ]);

    // Unique cities with at least 1 active object
    if (citiesResult.data) {
      const uniqueCities = new Set<string>();
      for (const row of citiesResult.data) {
        const city = (row.location as string)?.trim();
        if (city) uniqueCities.add(city);
      }
      cityPages = Array.from(uniqueCities).map((city) => ({
        url: `${BASE_URL}/objects/city/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"))}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));
    }

    // Unique categories with at least 1 active object
    if (categoriesResult.data) {
      const uniqueCategories = new Set<string>();
      for (const row of categoriesResult.data) {
        const cat = (row.category as string)?.trim();
        if (cat) uniqueCategories.add(cat);
      }
      categoryPages = Array.from(uniqueCategories).map((cat) => ({
        url: `${BASE_URL}/objects/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}`,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      }));
    }

    // Individual active objects
    if (itemsResult.data) {
      objectPages = itemsResult.data.map((item) => ({
        url: `${BASE_URL}/objects/${item.id}`,
        lastModified: item.updated_at ? new Date(item.updated_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    }
  }

  return [
    ...staticHigh,
    ...staticMedium,
    ...categoryPages,
    ...cityPages,
    ...objectPages,
    ...blogPosts,
  ];
}
