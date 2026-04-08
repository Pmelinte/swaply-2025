import "server-only";

import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";

export interface BlogPostDB {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  coverImage?: string;
  seoKeyword: string;
  readingTime: string;
  content: string;
  sourceLang: string;
}

/** Get a Supabase client — prefer service role, fall back to server (anon) */
async function getSupabase() {
  return getServiceSupabase() ?? (await getServerSupabase());
}

interface BlogRow {
  slug: string;
  locale: string;
  title: string;
  description: string;
  date: string;
  author: string;
  category: string;
  tags: string[];
  cover_image: string | null;
  seo_keyword: string;
  read_time: string;
  content: string;
}

function mapRow(row: BlogRow): BlogPostDB {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    date: row.date,
    author: row.author,
    category: row.category,
    tags: row.tags ?? [],
    coverImage: row.cover_image ?? undefined,
    seoKeyword: row.seo_keyword,
    readingTime: row.read_time,
    content: row.content,
    sourceLang: "en",
  };
}

/**
 * Get all blog posts from Supabase (English source).
 * Sorted by date descending.
 */
export async function getAllPostsDB(): Promise<BlogPostDB[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", "en")
    .order("date", { ascending: false });

  if (error) {
    console.error("[blog-db] getAllPostsDB error:", error.message);
    return [];
  }

  return (data as BlogRow[]).map(mapRow);
}

/**
 * Get a single blog post by slug from Supabase.
 */
export async function getPostBySlugDB(
  slug: string,
): Promise<BlogPostDB | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("locale", "en")
    .maybeSingle();

  if (error) {
    console.error("[blog-db] getPostBySlugDB error:", error.message);
    return null;
  }

  return data ? mapRow(data as BlogRow) : null;
}

/**
 * Get all blog posts in a category from Supabase.
 */
export async function getPostsByCategoryDB(
  category: string,
): Promise<BlogPostDB[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", "en")
    .ilike("category", category)
    .order("date", { ascending: false });

  if (error) {
    console.error("[blog-db] getPostsByCategoryDB error:", error.message);
    return [];
  }

  return (data as BlogRow[]).map(mapRow);
}

/**
 * Get all unique categories from Supabase blog posts.
 */
export async function getAllCategoriesDB(): Promise<string[]> {
  const supabase = await getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("blog_posts")
    .select("category")
    .eq("locale", "en");

  if (error) {
    console.error("[blog-db] getAllCategoriesDB error:", error.message);
    return [];
  }

  const categories = new Set(
    (data as Array<{ category: string }>)
      .map((r) => r.category)
      .filter(Boolean),
  );
  return [...categories];
}
