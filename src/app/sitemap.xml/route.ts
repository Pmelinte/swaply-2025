import { buildSitemapIndexReferences, renderSitemapIndex } from "@/lib/seo/sitemaps";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export async function GET() {
  const body = renderSitemapIndex(await buildSitemapIndexReferences());
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
