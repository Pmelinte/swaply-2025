import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "src", "content", "blog");

export interface BlogPost {
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
}

function parsePostFromPath(filePath: string, slug: string): BlogPost {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? "",
    author: data.author ?? "Petru Melinte",
    category: data.category ?? "",
    tags: data.tags ?? [],
    coverImage: data.coverImage ?? data.image,
    seoKeyword: data.seoKeyword ?? "",
    readingTime: stats.text,
    content,
  };
}

function parsePost(file: string): BlogPost {
  return parsePostFromPath(path.join(BLOG_DIR, file), file.replace(/\.mdx$/, ""));
}

/**
 * Get all posts, preferring locale-specific versions when available.
 * Falls back to English (root) if no localized version exists.
 */
export function getAllPosts(locale?: string): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const enFiles = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  const localeDir = locale && locale !== "en" ? path.join(BLOG_DIR, locale) : null;
  const hasLocaleDir = localeDir && fs.existsSync(localeDir);

  return enFiles
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      // Try locale-specific file first
      if (hasLocaleDir) {
        const localePath = path.join(localeDir, file);
        if (fs.existsSync(localePath)) {
          return { ...parsePostFromPath(localePath, slug), sourceLang: locale! };
        }
      }
      // Fallback to English
      return { ...parsePost(file), sourceLang: "en" };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

/**
 * Get a single post by slug, with locale fallback.
 */
export function getPostBySlug(slug: string, locale?: string): (BlogPost & { sourceLang: string }) | null {
  // Try locale-specific version first
  if (locale && locale !== "en") {
    const localePath = path.join(BLOG_DIR, locale, `${slug}.mdx`);
    if (fs.existsSync(localePath)) {
      return { ...parsePostFromPath(localePath, slug), sourceLang: locale };
    }
  }
  // Fallback to English
  const enPath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(enPath)) return null;
  return { ...parsePost(`${slug}.mdx`), sourceLang: "en" };
}

export function getPostsByCategory(category: string, locale?: string): BlogPost[] {
  return getAllPosts(locale).filter(
    (p) => p.category.toLowerCase() === category.toLowerCase(),
  );
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  return [...new Set(posts.map((p) => p.category))].filter(Boolean);
}

/** Extract H2 and H3 headings from MDX content for Table of Contents */
export function extractHeadings(
  content: string,
): Array<{ level: 2 | 3; text: string; id: string }> {
  const regex = /^(#{2,3})\s+(.+)$/gm;
  const headings: Array<{ level: 2 | 3; text: string; id: string }> = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ level, text, id });
  }

  return headings;
}

/** Generate RSS 2.0 XML feed */
export function generateRSSFeed(posts: BlogPost[]): string {
  const baseUrl = "https://swaply.world";

  const items = posts
    .slice(0, 20)
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <category>${post.category}</category>
      <author>${post.author}</author>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog Swaply — Ghiduri de schimb, barter și economie circulară</title>
    <link>${baseUrl}/blog</link>
    <description>Articole despre barter, schimb de obiecte, economie circulară și cum să folosești Swaply.</description>
    <language>ro</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
