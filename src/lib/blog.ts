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

function parsePost(file: string): BlogPost {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
  const { data, content } = matter(raw);
  const stats = readingTime(content);

  return {
    slug: file.replace(/\.mdx$/, ""),
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

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parsePost)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const file = `${slug}.mdx`;
  const filePath = path.join(BLOG_DIR, file);
  if (!fs.existsSync(filePath)) return null;
  return parsePost(file);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return getAllPosts().filter(
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
