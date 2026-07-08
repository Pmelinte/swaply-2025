import { describe, expect, it } from "vitest";
import {
  buildPhotoDiscoveryFallback,
  canAttemptPhotoDiscovery,
  getPhotoDiscoveryImageIssues,
  shouldBlockManualItemCreation,
} from "@/lib/photo-discovery/photoDiscoveryPolicy";
import { PHOTO_DISCOVERY_DEMO_REQUESTS } from "@/lib/photo-discovery/photoDiscoverySeeds";

describe("photo discovery foundation", () => {
  it("allows valid image references to attempt discovery", () => {
    const request = PHOTO_DISCOVERY_DEMO_REQUESTS[0];

    expect(getPhotoDiscoveryImageIssues(request)).toEqual([]);
    expect(canAttemptPhotoDiscovery(request)).toBe(true);
  });

  it("detects low quality image input", () => {
    const request = PHOTO_DISCOVERY_DEMO_REQUESTS[2];

    expect(getPhotoDiscoveryImageIssues(request)).toContain("low_resolution");
    expect(canAttemptPhotoDiscovery(request)).toBe(false);
  });

  it("returns manual fallback for search by photo", () => {
    const result = buildPhotoDiscoveryFallback(PHOTO_DISCOVERY_DEMO_REQUESTS[0]);

    expect(result.source).toBe("fallback");
    expect(result.mode).toBe("search_by_photo");
    expect(result.detectedCandidates).toEqual([]);
    expect(result.searchSuggestions[0]?.label).toBe("vintage camera");
    expect(result.manualFallbackMessage).toContain("Continue by typing");
  });

  it("returns reverse discovery fallback suggestions", () => {
    const result = buildPhotoDiscoveryFallback(PHOTO_DISCOVERY_DEMO_REQUESTS[1]);

    expect(result.source).toBe("fallback");
    expect(result.mode).toBe("reverse_who_wants_it");
    expect(result.reverseSuggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.reverseSuggestions.map((suggestion) => suggestion.suggestedAction)).toContain("create_item");
  });

  it("never blocks manual item creation when AI photo discovery is unavailable", () => {
    expect(shouldBlockManualItemCreation()).toBe(false);
  });
});
