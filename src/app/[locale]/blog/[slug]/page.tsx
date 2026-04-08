import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/config";
import Script from "next/script";
import { notFound } from "next/navigation";
import { translateFields, translateOnDemand } from "@/lib/translate-on-demand";
import { getPostBySlugDB, getPostsByCategoryDB } from "@/lib/blog-db";
import { extractHeadings } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, Calendar, Clock, Tag, User } from "lucide-react";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { BlogShareButtons } from "@/components/blog/BlogShareButtons";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { getTranslations } from "next-intl/server";

export const revalidate = 3600;
export const dynamicParams = true;

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

async function translateContent(
  content: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string> {
  if (targetLang === sourceLang) return content;

  const lines = content.split(/\n/);
  const translated = await Promise.all(
    lines.map((line) => {
      const trimmed = line.trim();

      // Linie goală
      if (!trimmed) return Promise.resolve("");

      // Skip: cod, HTML, imagini markdown, separatori
      if (
        trimmed.startsWith("```") ||
        trimmed.startsWith("<") ||
        trimmed.startsWith("![") ||
        trimmed === "---"
      ) {
        return Promise.resolve(line);
      }

      // Bold labels: **Text:** sau **Text** la începutul liniei
      // ex: **Elektronik:** **Clothing and Fashion:**
      const boldLabelMatch = trimmed.match(/^\*\*(.+?)\*\*(:?)$/);
      if (boldLabelMatch) {
        const innerText = boldLabelMatch[1];
        const colon = boldLabelMatch[2];
        return translateOnDemand(innerText, targetLang, sourceLang).then(
          (t) => `**${t}**${colon}`,
        );
      }

      // Headings: ## text sau ### text
      const headingMatch = line.match(/^(#{1,6}\s+)(.*)/);
      if (headingMatch) {
        const prefix = headingMatch[1]; // ex: "## "
        const text = headingMatch[2];
        if (!text.trim()) return Promise.resolve(line);
        return translateOnDemand(text, targetLang, sourceLang).then(
          (t) => prefix + t,
        );
      }

      // Liste și blockquotes: - item, * item, > quote, 1. item
      const listMatch = line.match(/^(\s*(?:\d+\.|[-*>])\s+)(.*)/);
      if (listMatch) {
        const prefix = listMatch[1]; // ex: "- " sau "1. "
        const text = listMatch[2];
        if (!text.trim()) return Promise.resolve(line);
        return translateOnDemand(text, targetLang, sourceLang).then(
          (t) => prefix + t,
        );
      }

      // Paragrafe normale — traduce tot
      return translateOnDemand(line, targetLang, sourceLang);
    }),
  );
  return translated.join("\n");
}

export async function generateStaticParams() {
  const { getAllPostsDB } = await import("@/lib/blog-db");
  const posts = await getAllPostsDB();
  return posts.slice(0, 10).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await getPostBySlugDB(slug, locale);
  if (!post) return { title: t("articleNotFound") };

  return {
    title: `${post.title} — Swaply Blog`,
    description: post.description,
    keywords: [post.seoKeyword, ...post.tags],
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      ...(post.coverImage && {
        images: [{ url: post.coverImage, alt: post.title }],
      }),
    },
    twitter: {
      card: post.coverImage ? "summary_large_image" : "summary",
      title: post.title,
      description: post.description,
      ...(post.coverImage && { images: [post.coverImage] }),
    },
    alternates: {
      canonical: `https://www.swaply.world/en/blog/${slug}`,
      languages: Object.fromEntries([
        ...locales.map((loc) => [
          loc,
          `https://www.swaply.world/${loc}/blog/${slug}`,
        ]),
        ["x-default", `https://www.swaply.world/en/blog/${slug}`],
      ]),
    },
  };
}

function createHeadingComponent(level: 2 | 3) {
  const Tag = level === 2 ? "h2" : "h3";
  return function HeadingComponent({
    children,
  }: {
    children?: React.ReactNode;
  }) {
    const text = String(children ?? "");
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    return <Tag id={id}>{children}</Tag>;
  };
}

const mdxComponents = {
  h2: createHeadingComponent(2),
  h3: createHeadingComponent(3),
};

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });

  const rawPost = await getPostBySlugDB(slug, locale);
  if (!rawPost) notFound();

  const contentSourceLang = rawPost.sourceLang;

  const [
    {
      title: translatedTitle,
      description: translatedDesc,
      category: translatedCategory,
    },
    translatedContent,
  ] = await Promise.all([
    translateFields(
      {
        title: rawPost.title,
        description: rawPost.description,
        category: rawPost.category,
      },
      locale,
      contentSourceLang,
    ),
    translateContent(rawPost.content, locale, contentSourceLang),
  ]);

  const post = {
    ...rawPost,
    title: translatedTitle,
    description: translatedDesc,
    category: translatedCategory,
    content: translatedContent,
  };

  const headings = extractHeadings(post.content);

  const rawRelated = (await getPostsByCategoryDB(post.category))
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  const related = await Promise.all(
    rawRelated.map(async (p) => ({
      ...p,
      title: await translateOnDemand(p.title, locale, contentSourceLang),
      description: await translateOnDemand(
        p.description,
        locale,
        contentSourceLang,
      ),
    })),
  );

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    author: { "@type": "Person", name: "Petru Melinte" },
    datePublished: post.date,
    publisher: { "@type": "Organization", name: "Swaply" },
    ...(post.coverImage && { image: post.coverImage }),
  };

  return (
    <div className="mx-auto max-w-[720px] space-y-8">
      <Script
        id="article-schema"
        type="application/ld+json"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToBlog")}
      </Link>

      <header className="space-y-4">
        <Link
          href={`/blog/category/${encodeURIComponent(post.category)}`}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
        >
          <Tag className="h-3 w-3" />
          {t(rawPost.category.toLowerCase() as Parameters<typeof t>[0])}
        </Link>

        <h1 className="text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {post.title}
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          {post.description}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {post.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {post.date}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readingTime}
          </span>
        </div>

        <BlogShareButtons title={post.title} slug={post.slug} />
      </header>

      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full rounded-2xl object-cover shadow-sm"
        />
      )}

      {headings.length > 2 && <TableOfContents headings={headings} />}

      <article className="prose prose-zinc max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-pre:rounded-xl prose-pre:bg-zinc-900 prose-pre:text-zinc-100 dark:prose-a:text-blue-400 dark:prose-pre:bg-zinc-800">
        <MDXRemote source={post.content} components={mdxComponents} />
      </article>

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <AuthorCard />
      <RelatedPosts posts={related} />

      <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
          {t("ctaTitle")}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("ctaDescription")}
        </p>
        <Link
          href="/register"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          {t("ctaButton")}
        </Link>
      </div>
    </div>
  );
}
