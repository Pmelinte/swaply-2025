import { describe, expect, it } from "vitest";
import {
  fallbackClassifyItem,
  fallbackEstimateValue,
  fallbackGenerateItemDescription,
  fallbackMatchExplanation,
  fallbackTranslateText,
} from "@/lib/ai/fallbacks";

describe("AI fallback responses", () => {
  it("keeps item classification safe and generic", () => {
    const result = fallbackClassifyItem({
      titleHint: "Vintage camera",
      descriptionHint: "Used for travel photos",
      images: [{ url: "https://example.com/camera.jpg" }],
      locale: "en",
    });

    expect(result.source).toBe("fallback");
    expect(result.category).toBe("objects");
    expect(result.confidence).toBe(0);
    expect(result.tags).toContain("vintage");
  });

  it("generates a conservative description from owner-provided fields", () => {
    const result = fallbackGenerateItemDescription({
      title: "Bike rack",
      category: "objects",
      condition: "used",
      userNotes: "Works with two bicycles",
      locale: "en",
    });

    expect(result.source).toBe("fallback");
    expect(result.description).toContain("Bike rack");
    expect(result.description).toContain("Works with two bicycles");
  });

  it("does not invent a monetary value", () => {
    const result = fallbackEstimateValue({ title: "Tablet", currency: "RON" });

    expect(result.source).toBe("fallback");
    expect(result.amount).toBeNull();
    expect(result.currency).toBe("RON");
    expect(result.confidence).toBe(0);
  });

  it("preserves original text when translation is unavailable", () => {
    const result = fallbackTranslateText({
      text: "Bună ziua",
      sourceLocale: "ro",
      targetLocale: "en",
    });

    expect(result.source).toBe("fallback");
    expect(result.text).toBe("Bună ziua");
    expect(result.warning).toContain("ro");
    expect(result.warning).toContain("en");
  });

  it("returns a manual-review match explanation", () => {
    const result = fallbackMatchExplanation({
      offeredTitle: "Camera",
      requestedTitle: "Tripod",
      distanceKm: 27.4,
    });

    expect(result.source).toBe("fallback");
    expect(result.score).toBe(0);
    expect(result.reasons.join(" ")).toContain("Camera");
    expect(result.reasons.join(" ")).toContain("27 km");
    expect(result.risks.length).toBeGreaterThan(0);
  });
});
