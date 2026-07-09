import { describe, expect, it } from "vitest";
import {
  PUBLIC_ROUTE_AUDIT_ENTRIES,
  getPublicDrawerAuditRoutes,
  getPublicLegalAuditRoutes,
  getPublicRouteAuditEntry,
  getPublicSeoAuditRoutes,
  getPublicSitemapAuditEntries,
  getPublicSitemapAuditRoutes,
  getPublicTrustAuditRoutes,
  getPublicVisualAuditRoutes,
  toLocalizedRoute,
  toSitemapPath,
} from "@/lib/public-pages/publicRouteAudit";
import {
  PUBLIC_EXPERIENCE_PAGES,
  publicPageExperienceConfigs,
} from "@/lib/public-pages/publicPageExperienceConfig";

describe("public route audit contract", () => {
  it("keeps route ids unique and paths internal", () => {
    const ids = PUBLIC_ROUTE_AUDIT_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of PUBLIC_ROUTE_AUDIT_ENTRIES) {
      expect(entry.path.startsWith("/")).toBe(true);
      expect(entry.path.startsWith("//")).toBe(false);
    }
  });

  it("localizes routes without duplicating slashes", () => {
    expect(toLocalizedRoute("/", "en")).toBe("/en");
    expect(toLocalizedRoute("objects", "ro")).toBe("/ro/objects");
    expect(toLocalizedRoute("/matching", "fr")).toBe("/fr/matching");
  });

  it("normalizes sitemap paths without duplicating locale prefixes", () => {
    expect(toSitemapPath("/")).toBe("");
    expect(toSitemapPath("objects")).toBe("/objects");
    expect(toSitemapPath("/privacy")).toBe("/privacy");
  });

  it("covers every configured public experience page with a route entry", () => {
    const routedPages = new Set(
      PUBLIC_ROUTE_AUDIT_ENTRIES.map((entry) => entry.page).filter(Boolean),
    );

    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      expect(routedPages.has(page)).toBe(true);
    }
  });

  it("marks all visual-audit routes as not login walls", () => {
    for (const entry of PUBLIC_ROUTE_AUDIT_ENTRIES.filter((item) => item.visualAudit)) {
      expect(entry.mustNotBeLoginWall).toBe(true);
      expect(entry.requiresPageContext).not.toBe(true);
    }
  });

  it("keeps contextual pages visible, but exempts context-only routes from browser screenshots and sitemap", () => {
    expect(getPublicRouteAuditEntry("chat-context")?.requiresPageContext).toBe(true);
    expect(getPublicRouteAuditEntry("chat-context")?.visualAudit).toBe(false);
    expect(getPublicRouteAuditEntry("chat-context")?.sitemapAudit).toBe(false);
    expect(getPublicRouteAuditEntry("profile-context")?.requiresPageContext).toBe(true);
    expect(getPublicRouteAuditEntry("profile-context")?.visualAudit).toBe(false);
    expect(getPublicRouteAuditEntry("profile-context")?.sitemapAudit).toBe(false);
  });

  it("matches the visual audit route list used by Playwright", () => {
    expect(getPublicVisualAuditRoutes("en")).toEqual([
      "/en",
      "/en/objects",
      "/en/properties",
      "/en/services",
      "/en/events",
      "/en/explore",
      "/en/matching",
      "/en/messages",
      "/en/exchange",
      "/en/blog",
      "/en/about",
      "/en/pricing",
      "/en/info",
      "/en/contact",
      "/en/terms",
      "/en/privacy",
      "/en/cookies",
      "/en/safety",
      "/en/dmca",
      "/en/copyright",
    ]);
  });

  it("matches the drawer audit route list used by Playwright", () => {
    expect(getPublicDrawerAuditRoutes("en")).toEqual([
      "/en/objects",
      "/en/properties",
      "/en/services",
      "/en/events",
      "/en/explore",
      "/en/matching",
      "/en/messages",
      "/en/exchange",
      "/en/blog",
    ]);
  });

  it("keeps the public SEO inventory aligned with sitemap routes", () => {
    expect(getPublicSeoAuditRoutes("en")).toEqual(getPublicSitemapAuditRoutes("en"));

    for (const entry of getPublicSitemapAuditEntries()) {
      expect(entry.seoAudit).toBe(true);
      expect(entry.sitemapPriority).toBeGreaterThan(0);
      expect(entry.sitemapPriority).toBeLessThanOrEqual(1);
      expect(entry.sitemapChangeFrequency).toBeDefined();
    }
  });

  it("keeps legal and trust inventory complete", () => {
    expect(getPublicLegalAuditRoutes("en")).toEqual([
      "/en/terms",
      "/en/privacy",
      "/en/cookies",
      "/en/safety",
      "/en/dmca",
      "/en/copyright",
    ]);

    expect(getPublicTrustAuditRoutes("en")).toEqual([
      "/en/about",
      "/en/pricing",
      "/en/info",
      "/en/contact",
      "/en/terms",
      "/en/privacy",
      "/en/cookies",
      "/en/safety",
      "/en/dmca",
      "/en/copyright",
    ]);
  });

  it("connects routed pages back to public-page experience requirements", () => {
    for (const entry of PUBLIC_ROUTE_AUDIT_ENTRIES) {
      if (!entry.page) continue;
      const config = publicPageExperienceConfigs[entry.page];
      expect(config).toBeDefined();
      expect(config.loginRequiredOnlyForRealActions).toBe(true);
      expect(config.requiredBlocks).toContain("hero");
      expect(config.requiredBlocks).toContain("preview");
      expect(config.requiredBlocks).toContain("what_unlocks_after_login");
      expect(config.requiredBlocks).toContain("contextual_cta");
    }
  });
});
