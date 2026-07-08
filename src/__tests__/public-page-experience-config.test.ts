import { describe, expect, it } from "vitest";
import {
  PUBLIC_EXPERIENCE_PAGES,
  publicPageExperienceConfigs,
} from "@/lib/public-pages/publicPageExperienceConfig";

describe("logged-out public page experience config", () => {
  it("covers every major logged-out public page from the Swaply memory", () => {
    expect(PUBLIC_EXPERIENCE_PAGES).toEqual([
      "home",
      "objects",
      "explore",
      "properties",
      "services",
      "events",
      "matching",
      "messages",
      "chat",
      "exchange",
      "profile",
    ]);

    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      expect(publicPageExperienceConfigs[page]).toBeDefined();
      expect(publicPageExperienceConfigs[page].page).toBe(page);
    }
  });

  it("requires meaningful logged-out content rather than blank login walls", () => {
    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      const config = publicPageExperienceConfigs[page];
      expect(config.requiredBlocks).toContain("hero");
      expect(config.requiredBlocks).toContain("preview");
      expect(config.requiredBlocks).toContain("what_unlocks_after_login");
      expect(config.requiredBlocks).toContain("contextual_cta");
    }
  });

  it("keeps login required only for real actions", () => {
    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      expect(publicPageExperienceConfigs[page].loginRequiredOnlyForRealActions).toBe(true);
    }
  });

  it("marks public examples as globally diverse", () => {
    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      expect(publicPageExperienceConfigs[page].globallyDiverseExamples).toBe(true);
    }
  });

  it("allows blog guide integration across public learning surfaces", () => {
    const guideReadyPages = PUBLIC_EXPERIENCE_PAGES.filter(
      (page) => publicPageExperienceConfigs[page].blogGuidesAllowed,
    );

    expect(guideReadyPages).toContain("home");
    expect(guideReadyPages).toContain("objects");
    expect(guideReadyPages).toContain("exchange");
  });
});
