import { getAllPosts } from "@/lib/blog";
import { getServiceSupabase } from "@/lib/supabase/service";
import { locales } from "@/i18n/config";
import { SEO_CITIES, SEO_CATEGORIES } from "@/lib/seo-data";
import { getPublicSitemapAuditEntries, toSitemapPath } from "@/lib/public-pages/publicRouteAudit";
import { SWAPLY_PUBLIC_BASE_URL, SWAPLY_PUBLIC_DOMAIN, toSwaplyLocalizedPublicUrl } from "@/lib/public-site";

export const SITEMAP_CHUNK_URL_LIMIT = 10_000;
export const SITEMAP_CHUNK_BYTE_LIMIT = 45 * 1024 * 1024;
export const DYNAMIC_SOURCE_LIMIT = 5_000;
export const SITEMAP_TYPES = ["static", "blog", "objects"] as const;
export type SitemapType = (typeof SITEMAP_TYPES)[number];

export type SitemapUrl = { url: string; lastModified?: Date | string };
export type SitemapReference = { type: SitemapType; page: number; loc: string };

function isSitemapType(value: string): value is SitemapType {
  return (SITEMAP_TYPES as readonly string[]).includes(value);
}

export function parseSitemapType(value: string): SitemapType | null {
  return isSitemapType(value) ? value : null;
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function slugify(value: string) {
  return encodeURIComponent(value.trim().toLowerCase().replace(/\s+/g, "-"));
}

export function dedupeAndFilterUrls(urls: Iterable<SitemapUrl>): SitemapUrl[] {
  const seen = new Set<string>();
  const result: SitemapUrl[] = [];
  for (const entry of urls) {
    try {
      const parsed = new URL(entry.url);
      if (parsed.protocol !== "https:" || parsed.host !== SWAPLY_PUBLIC_DOMAIN || parsed.search || parsed.hash) continue;
      if (seen.has(parsed.href)) continue;
      seen.add(parsed.href);
      result.push({ url: parsed.href, lastModified: entry.lastModified });
    } catch {
      continue;
    }
  }
  return result.sort((a, b) => a.url.localeCompare(b.url));
}

function localizedUrls(path: string, lastModified?: Date | string): SitemapUrl[] {
  return locales.map((locale) => ({ url: toSwaplyLocalizedPublicUrl(locale, path), lastModified }));
}

export function buildStaticSitemapUrls() {
  return dedupeAndFilterUrls(
    getPublicSitemapAuditEntries().flatMap((entry) => localizedUrls(toSitemapPath(entry.path))),
  );
}

export function buildBlogSitemapUrls() {
  return dedupeAndFilterUrls(
    getAllPosts().flatMap((post) => localizedUrls(`/blog/${post.slug}`, post.date)),
  );
}

async function fetchActiveObjectUrls() {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("items")
    .select("id, updated_at")
    .eq("status", "active")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(DYNAMIC_SOURCE_LIMIT);
  if (error || !data) return [];
  return data.flatMap((item) => localizedUrls(`/objects/${item.id}`, item.updated_at ?? undefined));
}

async function fetchObjectTaxonomyUrls() {
  const supabase = getServiceSupabase();
  if (!supabase) return [];
  const [citiesResult, categoriesResult] = await Promise.all([
    supabase.from("items").select("location").eq("status", "active").eq("is_active", true).not("location", "is", null).limit(DYNAMIC_SOURCE_LIMIT),
    supabase.from("items").select("category").eq("status", "active").eq("is_active", true).not("category", "is", null).limit(DYNAMIC_SOURCE_LIMIT),
  ]);
  const urls: SitemapUrl[] = [];
  if (!citiesResult.error && citiesResult.data) {
    for (const city of new Set(citiesResult.data.map((row) => String(row.location ?? "").trim()).filter(Boolean))) {
      urls.push(...localizedUrls(`/objects/city/${slugify(city)}`));
    }
  }
  if (!categoriesResult.error && categoriesResult.data) {
    for (const category of new Set(categoriesResult.data.map((row) => String(row.category ?? "").trim()).filter(Boolean))) {
      urls.push(...localizedUrls(`/objects/category/${slugify(category)}`));
    }
  }
  return urls;
}

function buildProgrammaticObjectUrls() {
  const urls: SitemapUrl[] = [];
  for (const city of SEO_CITIES) {
    for (const category of SEO_CATEGORIES) {
      if (category.slug !== "other") urls.push(...localizedUrls(`/objects/city/${city.slug}/${category.slug}`));
    }
  }
  return urls;
}

export async function buildSitemapUrls(type: SitemapType) {
  if (type === "static") return buildStaticSitemapUrls();
  if (type === "blog") return buildBlogSitemapUrls();
  const dynamicUrls = await Promise.allSettled([fetchObjectTaxonomyUrls(), fetchActiveObjectUrls()]);
  return dedupeAndFilterUrls([
    ...buildProgrammaticObjectUrls(),
    ...dynamicUrls.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
  ]);
}

export function chunkUrls(urls: SitemapUrl[], limit = SITEMAP_CHUNK_URL_LIMIT) {
  const chunks: SitemapUrl[][] = [];
  for (let index = 0; index < urls.length; index += limit) chunks.push(urls.slice(index, index + limit));
  return chunks.length ? chunks : [[]];
}

export async function buildSitemapIndexReferences() {
  const refs: SitemapReference[] = [];
  for (const type of SITEMAP_TYPES) {
    const urls = await buildSitemapUrls(type);
    chunkUrls(urls).forEach((_, page) => refs.push({ type, page, loc: `${SWAPLY_PUBLIC_BASE_URL}/sitemaps/${type}/${page}.xml` }));
  }
  return refs;
}

export function renderSitemapIndex(refs: SitemapReference[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${refs.map((ref) => `  <sitemap><loc>${escapeXml(ref.loc)}</loc></sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

export function renderUrlSet(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((entry) => {
    const lastmod = entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString()}</lastmod>` : "";
    return `  <url><loc>${escapeXml(entry.url)}</loc>${lastmod}</url>`;
  }).join("\n")}\n</urlset>\n`;
}
