import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/service", () => ({ getServiceSupabase: () => null }));

import {
  SITEMAP_CHUNK_BYTE_LIMIT,
  SITEMAP_CHUNK_URL_LIMIT,
  buildBlogSitemapUrls,
  buildSitemapIndexReferences,
  buildSitemapUrls,
  buildStaticSitemapUrls,
  chunkUrls,
  dedupeAndFilterUrls,
  renderSitemapIndex,
  renderUrlSet,
} from "@/lib/seo/sitemaps";

const canonicalHost = "https://www.swaply.world";

describe("sitemap index and chunked sitemaps", () => {
  it("renders a valid sitemap index instead of direct url entries", async () => {
    const xml = renderSitemapIndex(await buildSitemapIndexReferences());
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(`${canonicalHost}/sitemaps/static/0.xml`);
    expect(xml).not.toContain("<urlset");
  });

  it("separates static, blog and object URL types", async () => {
    const staticUrls = buildStaticSitemapUrls().map((entry) => entry.url);
    const blogUrls = buildBlogSitemapUrls().map((entry) => entry.url);
    const objectUrls = (await buildSitemapUrls("objects")).map((entry) => entry.url);
    expect(staticUrls.some((url) => url.includes("/privacy"))).toBe(true);
    expect(blogUrls.every((url) => url.includes("/blog/"))).toBe(true);
    expect(objectUrls.every((url) => url.includes("/objects/"))).toBe(true);
  });

  it("deduplicates URLs and rejects non-canonical hosts and query parameters", () => {
    const urls = dedupeAndFilterUrls([
      { url: `${canonicalHost}/en/objects` },
      { url: `${canonicalHost}/en/objects` },
      { url: `${canonicalHost}/en/objects?page=2` },
      { url: "https://localhost:3000/en/objects" },
      { url: "https://preview.swaply.world/en/objects" },
    ]);
    expect(urls).toEqual([{ url: `${canonicalHost}/en/objects` }]);
  });

  it("uses absolute canonical URLs and excludes private route namespaces", () => {
    const urls = buildStaticSitemapUrls().map((entry) => entry.url);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => url.startsWith(`${canonicalHost}/`))).toBe(true);
    expect(urls.some((url) => /\/(admin|auth|api|preview)(\/|$)/.test(url))).toBe(false);
  });

  it("keeps every chunk below URL and byte limits", async () => {
    for (const type of ["static", "blog", "objects"] as const) {
      for (const chunk of chunkUrls(await buildSitemapUrls(type))) {
        const xml = renderUrlSet(chunk);
        expect(chunk.length).toBeLessThanOrEqual(SITEMAP_CHUNK_URL_LIMIT);
        expect(Buffer.byteLength(xml, "utf8")).toBeLessThan(SITEMAP_CHUNK_BYTE_LIMIT);
      }
    }
  });

  it("is deterministic", async () => {
    await expect(buildSitemapIndexReferences()).resolves.toEqual(await buildSitemapIndexReferences());
    await expect(buildSitemapUrls("objects")).resolves.toEqual(await buildSitemapUrls("objects"));
  });

  it("keeps locale variants without inventing query URLs", () => {
    const urls = buildStaticSitemapUrls().map((entry) => entry.url);
    expect(urls).toContain(`${canonicalHost}/en/privacy`);
    expect(urls).toContain(`${canonicalHost}/ro/privacy`);
    expect(urls.every((url) => !url.includes("?"))).toBe(true);
  });

  it("degrades gracefully when dynamic sources are unavailable", async () => {
    const urls = await buildSitemapUrls("objects");
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((entry) => entry.url.includes("/objects/"))).toBe(true);
  });
});
