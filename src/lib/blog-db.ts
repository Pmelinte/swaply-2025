/**
 * blog-db.ts — Supabase-backed blog functions.
 * Drop-in replacement for blog.ts (same return types).
 *
 * All queries use locale="en" (English source).
 * sourceLang is hardcoded to "en" so translateOnDemand translates from English.
 */
import { createClient } from "@supabase/supabase-js";
import readingTime from "reading-time";
import type { BlogPost } from "./blog";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function mapRow(row: Record<string, unknown>): BlogPost & { sourceLang: string } {
  const content = String(row.content_md ?? "");
  return {
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    date: String(row.date ?? ""),
    author: String(row.author ?? "Swaply Team"),
    category: String(row.category ?? ""),
    tags: Array.isArray(row.tags) ? row.tags as string[] : [],
    coverImage: row.image ? String(row.image) : undefined,
    seoKeyword: String(row.slug ?? ""),
    readingTime: readingTime(content).text,
    content,
    sourceLang: "en",
  };
}

export async function getAllPostsDB(): Promise<(BlogPost & { sourceLang: string })[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", "en")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error) {
    console.error("[blog-db] getAllPostsDB error:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

export async function getPostBySlugDB(
  slug: string,
): Promise<(BlogPost & { sourceLang: string }) | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("locale", "en")
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("[blog-db] getPostBySlugDB error:", error.message);
    return null;
  }
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function getPostsByCategoryDB(
  category: string,
): Promise<(BlogPost & { sourceLang: string })[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", "en")
    .eq("published", true)
    .ilike("category", category)
    .order("date", { ascending: false });

  if (error) {
    console.error("[blog-db] getPostsByCategoryDB error:", error.message);
    return [];
  }
  return (data ?? []).map(mapRow);
}

export async function getAllCategoriesDB(): Promise<string[]> {
  const posts = await getAllPostsDB();
  return [...new Set(posts.map((p) => p.category))].filter(Boolean);
}
