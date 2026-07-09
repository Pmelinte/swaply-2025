import { describe, expect, it } from "vitest";
import {
  PUBLIC_EXPERIENCE_PAGES,
  publicPageExperienceConfigs,
} from "@/lib/public-pages/publicPageExperienceConfig";
import {
  PUBLIC_GUEST_PROOF_EXAMPLES,
  getGuestProofExamplesForPage,
  getGuestProofRegionsForPage,
} from "@/lib/public-pages/publicGuestProof";

describe("public guest proof examples", () => {
  it("keeps proof ids unique", () => {
    const ids = PUBLIC_GUEST_PROOF_EXAMPLES.map((example) => example.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every public experience page with at least one proof example", () => {
    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      expect(getGuestProofExamplesForPage(page).length).toBeGreaterThan(0);
    }
  });

  it("keeps most public proof examples visible before login", () => {
    const visibleBeforeLogin = PUBLIC_GUEST_PROOF_EXAMPLES.filter((example) => !example.requiresLogin);
    expect(visibleBeforeLogin.length).toBeGreaterThanOrEqual(10);
  });

  it("requires login only for real actions, not for public learning", () => {
    const loginRequiredExamples = PUBLIC_GUEST_PROOF_EXAMPLES.filter((example) => example.requiresLogin);
    expect(loginRequiredExamples.map((example) => example.page).sort()).toEqual(["chat", "profile"]);

    for (const example of PUBLIC_GUEST_PROOF_EXAMPLES) {
      const config = publicPageExperienceConfigs[example.page];
      expect(config.loginRequiredOnlyForRealActions).toBe(true);
    }
  });

  it("proves global-first examples across multiple regions", () => {
    const regions = new Set(PUBLIC_GUEST_PROOF_EXAMPLES.map((example) => example.region));
    expect(regions.has("europe")).toBe(true);
    expect(regions.has("americas")).toBe(true);
    expect(regions.has("asia")).toBe(true);
    expect(regions.has("africa")).toBe(true);
    expect(regions.has("oceania")).toBe(true);
    expect(regions.has("global")).toBe(true);
  });

  it("gives multi-example proof to the home and objects surfaces", () => {
    expect(getGuestProofExamplesForPage("home").length).toBeGreaterThanOrEqual(2);
    expect(getGuestProofExamplesForPage("objects").length).toBeGreaterThanOrEqual(2);
  });

  it("keeps domain pages globally oriented", () => {
    for (const page of ["objects", "properties", "services", "events"] as const) {
      expect(getGuestProofRegionsForPage(page).size).toBeGreaterThanOrEqual(1);
    }
  });
});
