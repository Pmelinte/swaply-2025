import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Articol negăsit — Swaply" };

  return {
    title: `${post.title} — Swaply Blog`,
    description: post.description,
    keywords: [post.seoKeyword, ...post.tags],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back nav */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Înapoi la blog
      </Link>

      {/* Header */}
      <header>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          <Tag className="h-3 w-3" />
          {post.category}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {post.title}
        </h1>
        <div className="mt-3 flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readingTime}
          </span>
        </div>
      </header>

      {/* MDX content */}
      <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl">
        <MDXRemote source={post.content} />
      </article>

      {/* CTA */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 text-center dark:border-blue-800 dark:bg-blue-950/30">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          Gata să încerci barter-ul modern?
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Listează obiectele tale și descoperă ce poți obține în schimb.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Încearcă Swaply gratuit →
        </Link>
      </div>
    </div>
  );
}
