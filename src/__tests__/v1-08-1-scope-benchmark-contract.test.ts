import { describe, expect, it } from "vitest";

import {
  V108_INITIAL_AUDIT,
  V108_REQUIREMENTS,
  V108_REQUIRED_BENCHMARK_DIMENSIONS,
  V108_REQUIRED_JOURNEYS,
  V108_REQUIRED_LOCALE_SAMPLE_MAX,
  V108_REQUIRED_LOCALE_SAMPLE_MIN,
} from "@/lib/v1-08/v1-08-contract";

describe("V1-08.1 scope and benchmark contract", () => {
  it("defines unique requirement IDs and one audit row per requirement", () => {
    const ids = Object.values(V108_REQUIREMENTS).flat();
    const auditIds = V108_INITIAL_AUDIT.map((entry) => entry.id);

    expect(ids).toHaveLength(22);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(auditIds).size).toBe(auditIds.length);
    expect([...auditIds].sort()).toEqual([...ids].sort());
  });

  it("keeps unknown or incomplete evidence explicit", () => {
    expect(
      V108_INITIAL_AUDIT.some(
        (entry) =>
          entry.code === "unknown" ||
          entry.database === "unknown" ||
          entry.tests === "unknown" ||
          entry.production === "unknown",
      ),
    ).toBe(true);

    expect(
      V108_INITIAL_AUDIT.every(
        (entry) =>
          entry.production !== "production_verified" || entry.gap === null,
      ),
    ).toBe(true);
  });

  it("requires the canonical multilingual benchmark range", () => {
    expect(V108_REQUIRED_LOCALE_SAMPLE_MIN).toBe(10);
    expect(V108_REQUIRED_LOCALE_SAMPLE_MAX).toBe(15);
    expect(V108_REQUIRED_LOCALE_SAMPLE_MIN).toBeLessThan(
      V108_REQUIRED_LOCALE_SAMPLE_MAX,
    );
  });

  it("requires cost, latency, safety, privacy and human confirmation evidence", () => {
    expect(V108_REQUIRED_BENCHMARK_DIMENSIONS).toEqual(
      expect.arrayContaining([
        "quality",
        "locale_coverage",
        "schema_correctness",
        "safety",
        "cost",
        "latency",
        "fallback",
        "privacy",
        "provenance",
        "human_confirmation",
      ]),
    );
  });

  it("requires global-first and AI journeys without authorising paid providers", () => {
    expect(V108_REQUIRED_JOURNEYS).toEqual(
      expect.arrayContaining([
        "profile_language_preferences",
        "guest_multi_locale_routes",
        "authenticated_translation_show_original",
        "rtl_desktop_mobile_layout",
        "blog_translation_completeness",
        "stories_translation_completeness",
        "item_image_classification_l1_l2",
        "localized_item_description",
        "localized_matching_explanation",
        "multilingual_moderation_review",
        "provider_failure_non_ai_fallback",
      ]),
    );

    expect(JSON.stringify(V108_INITIAL_AUDIT)).not.toContain(
      "provider activation authorised",
    );
  });
});
