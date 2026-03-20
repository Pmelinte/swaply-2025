import type { Metadata } from "next";
import Link from "next/link";
import { Rss } from "lucide-react";
import { getAllPosts, getAllCategories } from "@/lib/blog";
import { BlogSearch } from "@/components/blog/BlogSearch";

export const metadata: Metadata = {
  title: "Blog Swaply — Ghiduri de schimb, barter și economie circulară",
  description:
    "Articole despre barter, schimb de obiecte, economie circulară și cum să folosești Swaply.",
  openGraph: {
    title: "Blog Swaply — Ghiduri de schimb, barter și economie circulară",
    description:
      "Articole despre barter, schimb de obiecte, economie circulară și cum să folosești Swaply.",
    type: "website",
  },
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Blog
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Ghiduri de schimb, barter și economie circulară.
          </p>
        </div>
        <Link
          href="/blog/feed.xml"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          title="RSS Feed"
        >
          <Rss className="h-3.5 w-3.5" />
          RSS
        </Link>
      </div>

      <BlogSearch posts={posts} categories={categories} />
    </div>
  );
}
