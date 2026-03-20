import { getAllPosts, generateRSSFeed } from "@/lib/blog";

export async function GET() {
  const posts = getAllPosts();
  const rss = generateRSSFeed(posts);
  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
