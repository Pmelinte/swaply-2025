import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { getServiceSupabase } from "@/lib/supabase/service";
import { locales } from "@/i18n/config";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // re-generate at most every hour

const BASE_URL = "https://www.swaply.world";

/** Create a sitemap entry for each locale variant of a path */
function localizedEntry(
  path: string,
  opts: {
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
    lastModified?: Date;
  } = {},
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE_URL}/${locale}${path}`,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    lastModified: opts.lastModified,
    alternates: {
      languages: Object.fromEntries([
        ...locales.map((loc) => [loc, `${BASE_URL}/${loc}${path}`]),
        ["x-default", `${BASE_URL}/en${path}`],
      ]),
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticHigh = [
    ...localizedEntry("", { changeFrequency: "daily", priority: 1 }),
    ...localizedEntry("/about", { changeFrequency: "monthly", priority: 1 }),
    ...localizedEntry("/pricing", { changeFrequency: "monthly", priority: 1 }),
    ...localizedEntry("/info", { changeFrequency: "weekly", priority: 1 }),
    ...localizedEntry("/blog", { changeFrequency: "weekly", priority: 1 }),
  ];

  const staticMedium = [
    ...localizedEntry("/terms", { changeFrequency: "monthly", priority: 0.8 }),
    ...localizedEntry("/privacy", { changeFrequency: "monthly", priority: 0.8 }),
    ...localizedEntry("/safety", { changeFrequency: "monthly", priority: 0.8 }),
    ...localizedEntry("/cookies", { changeFrequency: "monthly", priority: 0.8 }),
  ];

  // Blog posts from MDX files
  const blogPosts = getAllPosts().flatMap((post) =>
    localizedEntry(`/blog/${post.slug}`, {
      changeFrequency: "monthly",
      priority: 0.7,
      lastModified: new Date(post.date),
    }),
  );

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
      cityPages = Array.from(uniqueCities).flatMap((city) =>
        localizedEntry(
          `/objects/city/${encodeURIComponent(city.toLowerCase().replace(/\s+/g, "-"))}`,
          { changeFrequency: "weekly", priority: 0.9 },
        ),
      );
    }

    // Unique categories with at least 1 active object
    if (categoriesResult.data) {
      const uniqueCategories = new Set<string>();
      for (const row of categoriesResult.data) {
        const cat = (row.category as string)?.trim();
        if (cat) uniqueCategories.add(cat);
      }
      categoryPages = Array.from(uniqueCategories).flatMap((cat) =>
        localizedEntry(
          `/objects/category/${encodeURIComponent(cat.toLowerCase().replace(/\s+/g, "-"))}`,
          { changeFrequency: "weekly", priority: 0.9 },
        ),
      );
    }

    // Individual active objects
    if (itemsResult.data) {
      objectPages = itemsResult.data.flatMap((item) =>
        localizedEntry(`/objects/${item.id}`, {
          changeFrequency: "weekly",
          priority: 0.7,
          lastModified: item.updated_at
            ? new Date(item.updated_at)
            : undefined,
        }),
      );
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
