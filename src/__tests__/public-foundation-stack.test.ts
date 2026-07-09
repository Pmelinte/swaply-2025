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
  getPublicFoundationStackCopyStatus,
  getPublicFoundationStackCopyStatuses,
  getPublicFoundationStackTrackCopy,
  PUBLIC_FOUNDATION_STACK_COPY_FIELDS,
  PUBLIC_FOUNDATION_STACK_DEFAULT_COPY,
  PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE,
} from "@/lib/public-foundation-stack/publicFoundationStackCopy";
import type { PublicFoundationStackTrackId } from "@/lib/public-foundation-stack/publicFoundationStackTypes";
import { PUBLIC_EXPERIENCE_PAGES } from "@/lib/public-pages/publicPageExperienceConfig";

const DEFAULT_PUBLIC_FOUNDATION_PAGES = [
  "home",
  "objects",
  "properties",
  "services",
  "events",
  "explore",
  "matching",
  "messages",
  "exchange",
] as const;

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

  it("keeps AI advisory visible on every default public foundation stack page", () => {
    for (const page of DEFAULT_PUBLIC_FOUNDATION_PAGES) {
      expect(getPublicFoundationStackTrackIdsForPage(page, 5), `${page} should show AI as advisory`).toContain(
        "ai_advisory",
      );
    }
  });

  it("keeps every public foundation card actionable through an internal route", () => {
    for (const track of PUBLIC_FOUNDATION_STACK_TRACKS) {
      expect(track.ctaHref, `${track.id} should use an internal CTA route`).toMatch(/^\//);
      expect(track.ctaLabel.trim(), `${track.id} should have a visible CTA label`).not.toEqual("");
    }
  });

  it("keeps the global fallback and safety tracks in the first five cards", () => {
    for (const page of DEFAULT_PUBLIC_FOUNDATION_PAGES) {
      const visibleTracks = getPublicFoundationStackTrackIdsForPage(page, 5);

      expect(visibleTracks, `${page} should show language fallback`).toContain("language_fallback");
      expect(visibleTracks, `${page} should show a login-gated safety or action card`).toContain("ai_advisory");
    }
  });

  it("keeps every foundation track connected to default copy", () => {
    const trackIds = new Set(PUBLIC_FOUNDATION_STACK_TRACKS.map((track) => track.id));
    const copyIds = new Set(Object.keys(PUBLIC_FOUNDATION_STACK_DEFAULT_COPY));

    expect(copyIds).toEqual(trackIds);

    for (const trackId of trackIds) {
      const copy = getPublicFoundationStackTrackCopy(trackId as PublicFoundationStackTrackId);

      for (const field of PUBLIC_FOUNDATION_STACK_COPY_FIELDS) {
        expect(copy[field].trim(), `${trackId}.${field} should have fallback copy`).not.toEqual("");
      }
    }
  });

  it("falls back to English copy when a requested locale is not ready", () => {
    for (const track of PUBLIC_FOUNDATION_STACK_TRACKS) {
      const defaultCopy = getPublicFoundationStackTrackCopy(track.id, PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE);
      const romanianFallbackCopy = getPublicFoundationStackTrackCopy(track.id, "ro-RO");
      const romanianFallbackStatus = getPublicFoundationStackCopyStatus(track.id, "ro-RO");

      expect(romanianFallbackCopy).toEqual(defaultCopy);
      expect(romanianFallbackStatus.usesDefaultFallback).toBe(true);
      expect(romanianFallbackStatus.missingFields).toEqual([...PUBLIC_FOUNDATION_STACK_COPY_FIELDS]);
    }
  });

  it("reports no missing copy fields for the default locale", () => {
    const statuses = getPublicFoundationStackCopyStatuses(PUBLIC_FOUNDATION_STACK_DEFAULT_LOCALE);

    expect(statuses).toHaveLength(PUBLIC_FOUNDATION_STACK_TRACKS.length);
    for (const status of statuses) {
      expect(status.usesDefaultFallback).toBe(false);
      expect(status.missingFields).toEqual([]);
    }
  });
});
