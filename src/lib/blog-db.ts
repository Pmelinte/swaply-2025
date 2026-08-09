/**
 * Supabase-backed Blog source with deterministic locale and MDX fallback.
 *
 * Resolution order:
 * 1. published row in the requested locale;
 * 2. published English row for the same slug;
 * 3. repository MDX, requested locale first and English second.
 */
import { createClient } from "@supabase/supabase-js";
import readingTime from "reading-time";
import {
  getAllPosts,
  getPostBySlug,
  getPostsByCategory,
  type BlogPost,
  type LocalizedBlogPost,
} from "./blog";
import {
  sanitizeBlogPublicTruthContent,
  sanitizeBlogPublicTruthText,
} from "./blog-public-truth";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeLocale(locale?: string): string {
  return (
    (locale ?? "en")
      .trim()
      .toLowerCase()
      .split(/[-_]/)[0] || "en"
  );
}

function mapRow(row: Record<string, unknown>): LocalizedBlogPost {
  const content = sanitizeBlogPublicTruthContent(String(row.content_md ?? ""));
  const sourceLang = normalizeLocale(String(row.locale ?? "en"));

  return {
    slug: String(row.slug ?? ""),
    title: sanitizeBlogPublicTruthText(String(row.title ?? "")),
    description: sanitizeBlogPublicTruthText(String(row.description ?? "")),
    date: String(row.date ?? ""),
    author: String(row.author ?? "Swaply Team"),
    category: String(row.category ?? ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    coverImage: row.image ? String(row.image) : undefined,
    seoKeyword: String(row.slug ?? ""),
    readingTime: readingTime(content).text,
    content,
    sourceLang,
  };
}

function preferRequestedLocale(
  rows: Record<string, unknown>[],
  requestedLocale: string,
): LocalizedBlogPost[] {
  const selected = new Map<string, LocalizedBlogPost>();

  for (const row of rows) {
    const post = mapRow(row);
    const existing = selected.get(post.slug);

    if (
      !existing ||
      (post.sourceLang === requestedLocale &&
        existing.sourceLang !== requestedLocale)
    ) {
      selected.set(post.slug, post);
    }
  }

  return [...selected.values()].sort((a, b) =>
    a.date > b.date ? -1 : a.date < b.date ? 1 : 0,
  );
}

export async function getAllPostsDB(
  locale?: string,
): Promise<LocalizedBlogPost[]> {
  const requestedLocale = normalizeLocale(locale);
  const supabase = getSupabase();

  if (!supabase) return getAllPosts(requestedLocale);

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: false });

  query =
    requestedLocale === "en"
      ? query.eq("locale", "en")
      : query.in("locale", [requestedLocale, "en"]);

  const { data, error } = await query;

  if (error) {
    console.error("[blog-db] getAllPostsDB error:", error.message);
    return getAllPosts(requestedLocale);
  }

  const posts = preferRequestedLocale(
    (data ?? []) as Record<string, unknown>[],
    requestedLocale,
  );

  return posts.length > 0 ? posts : getAllPosts(requestedLocale);
}

export async function getPostBySlugDB(
  slug: string,
  locale?: string,
): Promise<LocalizedBlogPost | null> {
  const requestedLocale = normalizeLocale(locale);
  const supabase = getSupabase();

  if (!supabase) return getPostBySlug(slug, requestedLocale);

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true);

  query =
    requestedLocale === "en"
      ? query.eq("locale", "en")
      : query.in("locale", [requestedLocale, "en"]);

  const { data, error } = await query;

  if (error) {
    console.error("[blog-db] getPostBySlugDB error:", error.message);
    return getPostBySlug(slug, requestedLocale);
  }

  const posts = preferRequestedLocale(
    (data ?? []) as Record<string, unknown>[],
    requestedLocale,
  );

  return posts[0] ?? getPostBySlug(slug, requestedLocale);
}

export async function getPostsByCategoryDB(
  category: string,
  locale: string,
): Promise<LocalizedBlogPost[]> {
  const requestedLocale = normalizeLocale(locale);
  const posts = await getAllPostsDB(requestedLocale);
  const normalizedCategory = category.trim().toLowerCase();

  if (posts.length > 0) {
    return posts.filter(
      (post) => post.category.trim().toLowerCase() === normalizedCategory,
    );
  }

  return getPostsByCategory(category, requestedLocale);
}

export async function getAllCategoriesDB(locale?: string): Promise<string[]> {
  const posts = await getAllPostsDB(locale);
  return [...new Set(posts.map((post: BlogPost) => post.category))].filter(
    Boolean,
  );
}
