import { describe, expect, it } from "vitest";
import {
  RELEASE_SMOKE_LOCALES,
  REQUIRED_CI_ARTIFACTS,
  REQUIRED_CI_JOBS,
  STACKED_PR_RELEASE_ORDER,
  getMissingRequiredArtifacts,
  getMissingRequiredJobs,
  getReleaseDrawerSmokeRoutes,
  getReleaseSmokeRoutes,
  isSupportedReleaseSmokeLocale,
} from "@/lib/release/releaseReadiness";

describe("release readiness contract", () => {
  it("requires the same CI jobs that protect stacked PRs", () => {
    expect(REQUIRED_CI_JOBS).toEqual([
      "Unit Tests",
      "Lint & Type Check",
      "Build",
      "Public Visual Audit",
    ]);
  });

  it("requires visual and unit-test artifacts", () => {
    expect(REQUIRED_CI_ARTIFACTS).toContain("vitest-results");
    expect(REQUIRED_CI_ARTIFACTS).toContain("swaply-public-visual-audit-screenshots");
    expect(REQUIRED_CI_ARTIFACTS).toContain("swaply-public-visual-audit-report");
    expect(REQUIRED_CI_ARTIFACTS).toContain("swaply-public-visual-audit-test-results");
  });

  it("detects missing CI jobs and artifacts", () => {
    expect(getMissingRequiredJobs(["Unit Tests", "Build"])).toEqual([
      "Lint & Type Check",
      "Public Visual Audit",
    ]);

    expect(getMissingRequiredArtifacts(["vitest-results"])).toEqual([
      "swaply-public-visual-audit-screenshots",
      "swaply-public-visual-audit-report",
      "swaply-public-visual-audit-test-results",
    ]);
  });

  it("preserves stacked PR order", () => {
    expect(STACKED_PR_RELEASE_ORDER[0]).toBe("agentic/batch-1-global-drawer-public-blog");
    expect(STACKED_PR_RELEASE_ORDER.at(-1)).toBe("agentic/batch-7-release-readiness");
    expect(new Set(STACKED_PR_RELEASE_ORDER).size).toBe(STACKED_PR_RELEASE_ORDER.length);
  });

  it("uses supported smoke locales including non-English and 3-letter locale coverage", () => {
    expect(RELEASE_SMOKE_LOCALES).toEqual(["en", "ro", "fr", "fil"]);
    expect(isSupportedReleaseSmokeLocale("ro")).toBe(true);
    expect(isSupportedReleaseSmokeLocale("fil")).toBe(true);
    expect(isSupportedReleaseSmokeLocale("xx")).toBe(false);
  });

  it("generates public smoke routes for every release smoke locale", () => {
    const routes = getReleaseSmokeRoutes();

    for (const locale of RELEASE_SMOKE_LOCALES) {
      expect(routes).toContain(`/${locale}`);
      expect(routes).toContain(`/${locale}/objects`);
      expect(routes).toContain(`/${locale}/matching`);
      expect(routes).toContain(`/${locale}/blog`);
    }
  });

  it("generates drawer smoke routes for every release smoke locale", () => {
    const routes = getReleaseDrawerSmokeRoutes();

    for (const locale of RELEASE_SMOKE_LOCALES) {
      expect(routes).toContain(`/${locale}/objects`);
      expect(routes).toContain(`/${locale}/matching`);
      expect(routes).toContain(`/${locale}/exchange`);
      expect(routes).toContain(`/${locale}/blog`);
    }
  });
});
