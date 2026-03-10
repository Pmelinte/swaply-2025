import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Swaply",
  description: "Articole despre barter, schimb de obiecte, economie circulară și cum să folosești Swaply.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Blog</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Articole despre barter, economie circulară și schimb de obiecte.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-zinc-500">Niciun articol încă.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Tag className="h-3 w-3" />
                {post.category}
              </span>

              <h2 className="mt-3 text-lg font-bold text-zinc-900 group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-400">
                {post.title}
              </h2>

              <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {post.description}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {post.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readingTime}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
