import { Link } from "@/i18n/navigation";
import { Calendar, Clock, Tag } from "lucide-react";
import type { BlogPost } from "@/lib/blog";

export function RelatedPosts({ posts }: { posts: BlogPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Articole similare
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-blue-600"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Tag className="h-3 w-3" />
              {post.category}
            </span>
            <h3 className="mt-2 text-sm font-bold leading-snug text-zinc-900 group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-400">
              {post.title}
            </h3>
            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
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
    </section>
  );
}
