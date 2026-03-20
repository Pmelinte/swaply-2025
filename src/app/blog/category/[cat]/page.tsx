import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import { getAllCategories, getPostsByCategory } from "@/lib/blog";

interface Props {
  params: Promise<{ cat: string }>;
}

export async function generateStaticParams() {
  return getAllCategories().map((cat) => ({ cat }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat } = await params;
  const category = decodeURIComponent(cat);
  return {
    title: `${category} — Blog Swaply`,
    description: `Articole din categoria "${category}" pe blogul Swaply.`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { cat } = await params;
  const category = decodeURIComponent(cat);
  const posts = getPostsByCategory(category);

  return (
    <div className="space-y-6">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Toate articolele
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {category}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {posts.length} {posts.length === 1 ? "articol" : "articole"} în
          această categorie.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          Niciun articol în această categorie.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600"
            >
              {post.coverImage && (
                <div className="relative h-44 w-full overflow-hidden rounded-t-2xl bg-zinc-100 dark:bg-zinc-700">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  <Tag className="h-3 w-3" />
                  {post.category}
                </span>

                <h2 className="mt-3 text-lg font-bold leading-snug text-zinc-900 group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-400">
                  {post.title}
                </h2>

                <p className="mt-2 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {post.description}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readingTime}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.author}
                  </span>
                </div>

                <span className="mt-3 text-sm font-semibold text-blue-600 group-hover:text-blue-700 dark:text-blue-400">
                  Citește mai mult →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
