import { describe, expect, it } from "vitest";
import { INTEGRATION_AUDIT_V2_CHECKS } from "@/lib/integration-audit-v2/integrationAuditSeeds";
import {
  getMissingRequiredPublicFoundationTrackIds,
  getPublicFoundationStackSummaryForPage,
  getPublicFoundationStackTrackIdsForPage,
  PUBLIC_FOUNDATION_STACK_TRACKS,
  REQUIRED_PUBLIC_FOUNDATION_TRACKS,
} from "@/lib/public-foundation-stack/publicFoundationStackContent";
import {
  FOUNDATION_STACK_PUBLIC_PAGES,
  FOUNDATION_STACK_PUBLIC_ROUTE_IDS,
  FOUNDATION_STACK_REQUIRED_TRACKS_BY_PAGE,
  getFoundationStackLocalizedRoutes,
  getFoundationStackPublicRouteEntries,
  getMissingFoundationStackRequiredTrackIdsForPage,
  getRequiredFoundationStackTrackIdsForPage,
  shouldRenderFoundationStackForLocalizedRoute,
} from "@/lib/public-foundation-stack/publicFoundationStackRoutePolicy";
import { PUBLIC_EXPERIENCE_PAGES } from "@/lib/public-pages/publicPageExperienceConfig";
import { getPublicVisualAuditRoutes } from "@/lib/public-pages/publicRouteAudit";

describe("public foundation stack UI content", () => {
  it("connects every public foundation card to an integration audit check", () => {
    const checkIds = new Set(INTEGRATION_AUDIT_V2_CHECKS.map((check) => check.id));

    for (const track of PUBLIC_FOUNDATION_STACK_TRACKS) {
      expect(track.auditCheckIds.length).toBeGreaterThan(0);
      for (const checkId of track.auditCheckIds) {
        expect(checkIds.has(checkId), `${track.id} references ${checkId}`).toBe(true);
      }
    }
  });

  it("keeps the required public explanation tracks visible on the home page", () => {
    const missing = getMissingRequiredPublicFoundationTrackIds("home", 5);

    expect(REQUIRED_PUBLIC_FOUNDATION_TRACKS).toEqual([
      "ai_advisory",
      "token_rank",
      "language_fallback",
      "exchange_safety",
    ]);
    expect(missing).toEqual([]);
  });

  it("prioritizes matching around AI, advanced modes and consent", () => {
    const matchingTracks = getPublicFoundationStackTrackIdsForPage("matching", 5);

    expect(matchingTracks).toContain("ai_advisory");
    expect(matchingTracks).toContain("advanced_swaps");
    expect(matchingTracks).toContain("exchange_safety");
  });

  it("prioritizes messages around guided chat and language fallback", () => {
    const messageTracks = getPublicFoundationStackTrackIdsForPage("messages", 5);

    expect(messageTracks).toContain("guided_chat");
    expect(messageTracks).toContain("language_fallback");
  });

  it("keeps real actions login-gated while public explanations remain visible", () => {
    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      const summary = getPublicFoundationStackSummaryForPage(page, 5);

      expect(summary.loginRequiredOnlyForRealActions).toBe(true);
      expect(summary.tracks.length, `${page} should expose at least one public foundation card`).toBeGreaterThan(0);
    }
  });

  it("keeps the foundation stack route policy aligned with public audit routes", () => {
    const visualRoutes = new Set(getPublicVisualAuditRoutes("en"));
    const foundationRoutes = getFoundationStackLocalizedRoutes("en");
    const routeEntries = getFoundationStackPublicRouteEntries();

    expect(routeEntries.map((entry) => entry.id)).toEqual([...FOUNDATION_STACK_PUBLIC_ROUTE_IDS]);
    expect(routeEntries.map((entry) => entry.page)).toEqual([...FOUNDATION_STACK_PUBLIC_PAGES]);

    for (const route of foundationRoutes) {
      expect(visualRoutes.has(route), `${route} should remain in the public visual audit`).toBe(true);
      expect(shouldRenderFoundationStackForLocalizedRoute(route, "en"), `${route} should require foundation stack`).toBe(true);
    }
  });

  it("keeps page-specific required guardrails visible inside the default card limit", () => {
    for (const page of FOUNDATION_STACK_PUBLIC_PAGES) {
      const requiredTrackIds = getRequiredFoundationStackTrackIdsForPage(page);
      const missingTrackIds = getMissingFoundationStackRequiredTrackIdsForPage(page, 5);

      expect(requiredTrackIds, `${page} should have route-specific required tracks`).toEqual(
        FOUNDATION_STACK_REQUIRED_TRACKS_BY_PAGE[page],
      );
      expect(missingTrackIds, `${page} should not hide required tracks beyond the default limit`).toEqual([]);
    }
  });

  it("keeps AI advisory visible on every public foundation stack page", () => {
    for (const page of FOUNDATION_STACK_PUBLIC_PAGES) {
      expect(getPublicFoundationStackTrackIdsForPage(page, 5), `${page} should show AI as advisory`).toContain(
        "ai_advisory",
      );
    }
  });
});
