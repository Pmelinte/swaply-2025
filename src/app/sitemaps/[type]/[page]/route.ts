import { buildSitemapUrls, chunkUrls, parseSitemapType, renderUrlSet } from "@/lib/seo/sitemaps";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

type Params = { type: string; page: string };

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { type: rawType, page: rawPage } = await context.params;
  const type = parseSitemapType(rawType);
  const page = Number.parseInt(rawPage.replace(/\.xml$/, ""), 10);
  if (!type || !Number.isInteger(page) || page < 0) return new Response("Not found", { status: 404 });

  const chunks = chunkUrls(await buildSitemapUrls(type));
  const urls = chunks[page];
  if (!urls) return new Response("Not found", { status: 404 });

  return new Response(renderUrlSet(urls), { headers: { "content-type": "application/xml; charset=utf-8" } });
}
