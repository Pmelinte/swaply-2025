import { describe, expect, it } from "vitest";
import {
  BOTTOM_NAV_HREFS,
  CONTEXTUAL_DRAWER_PAGES,
  contextualDrawerConfigs,
  isBottomNavHref,
} from "@/lib/drawer/contextualDrawerConfig";

describe("contextual drawer config", () => {
  it("has page-specific config for every major Swaply page", () => {
    expect(CONTEXTUAL_DRAWER_PAGES).toEqual([
      "objects",
      "properties",
      "services",
      "events",
      "matching",
      "messages",
      "chat",
      "exchange",
      "blog",
      "stories",
    ]);

    for (const page of CONTEXTUAL_DRAWER_PAGES) {
      expect(contextualDrawerConfigs[page]).toBeDefined();
      expect(contextualDrawerConfigs[page].page).toBe(page);
      expect(contextualDrawerConfigs[page].sections.length).toBeGreaterThan(0);
    }
  });

  it("keeps drawer sections contextual instead of duplicating bottom navigation", () => {
    for (const page of CONTEXTUAL_DRAWER_PAGES) {
      for (const section of contextualDrawerConfigs[page].sections) {
        for (const item of section.items) {
          expect(isBottomNavHref(item.href)).toBe(false);
        }
      }
    }
  });

  it("defines the bottom navigation hrefs that must not be copied into contextual drawers", () => {
    expect(BOTTOM_NAV_HREFS).toEqual(["/", "/explore", "/matching", "/messages", "/exchange"]);
  });

  it("includes the required contextual section categories across the config", () => {
    const usedSections = new Set(
      CONTEXTUAL_DRAWER_PAGES.flatMap((page) => contextualDrawerConfigs[page].sections.map((section) => section.id)),
    );

    expect(usedSections.has("filters")).toBe(true);
    expect(usedSections.has("quick_actions")).toBe(true);
    expect(usedSections.has("ai_recommendations")).toBe(true);
    expect(usedSections.has("status") || usedSections.has("page_context")).toBe(true);
  });
});
