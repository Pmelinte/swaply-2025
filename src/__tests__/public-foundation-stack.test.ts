import { describe, expect, it } from "vitest";
import { INTEGRATION_AUDIT_V2_CHECKS } from "@/lib/integration-audit-v2/integrationAuditSeeds";
import {
  getMissingRequiredPublicFoundationTrackIds,
  getPublicFoundationStackSummaryForPage,
  getPublicFoundationStackTrackIdsForPage,
  PUBLIC_FOUNDATION_STACK_TRACKS,
  REQUIRED_PUBLIC_FOUNDATION_TRACKS,
} from "@/lib/public-foundation-stack/publicFoundationStackContent";
import { PUBLIC_EXPERIENCE_PAGES } from "@/lib/public-pages/publicPageExperienceConfig";

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
    const missing = getMissingRequiredPublicFoundationTrackIds("home", 8);

    expect(REQUIRED_PUBLIC_FOUNDATION_TRACKS).toEqual([
      "ai_advisory",
      "token_rank",
      "language_fallback",
      "exchange_safety",
    ]);
    expect(missing).toEqual([]);
  });

  it("prioritizes matching around AI, advanced modes and consent", () => {
    const matchingTracks = getPublicFoundationStackTrackIdsForPage("matching", 4);

    expect(matchingTracks).toContain("ai_advisory");
    expect(matchingTracks).toContain("advanced_swaps");
    expect(matchingTracks).toContain("exchange_safety");
  });

  it("prioritizes messages around guided chat and language fallback", () => {
    const messageTracks = getPublicFoundationStackTrackIdsForPage("messages", 4);

    expect(messageTracks).toContain("guided_chat");
    expect(messageTracks).toContain("language_fallback");
  });

  it("keeps real actions login-gated while public explanations remain visible", () => {
    for (const page of PUBLIC_EXPERIENCE_PAGES) {
      const summary = getPublicFoundationStackSummaryForPage(page, 4);

      expect(summary.loginRequiredOnlyForRealActions).toBe(true);
      expect(summary.tracks.length, `${page} should expose at least one public foundation card`).toBeGreaterThan(0);
    }
  });
});
