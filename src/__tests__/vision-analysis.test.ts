import { describe, expect, it } from "vitest";
import {
  buildVisionPrompt,
  fallbackVisionFromUrl,
  parseVisionResponse,
  resolveVisionCategory,
  resolveVisionLocale,
} from "@/lib/ai/vision-analysis";

describe("global-first vision analysis contract", () => {
  it("prefers an explicit BCP-47 locale", () => {
    expect(
      resolveVisionLocale({
        explicitLocale: "pt-BR",
        referer: "https://www.swaply.world/ro/objects/new",
        acceptLanguage: "de-DE,de;q=0.9",
      }),
    ).toBe("pt-BR");
  });

  it("derives the active locale from the localized route", () => {
    expect(
      resolveVisionLocale({
        referer: "https://www.swaply.world/fr/objects/new",
        acceptLanguage: "ro-RO,ro;q=0.9",
      }),
    ).toBe("fr");
  });

  it("falls back to Accept-Language and rejects malformed locale input", () => {
    expect(resolveVisionLocale({ acceptLanguage: "de-DE,de;q=0.9" })).toBe("de-DE");
    expect(resolveVisionLocale({ explicitLocale: "../ro" })).toBe("en");
  });

  it("builds a locale-specific prompt without Romanian hardcoding", () => {
    const prompt = buildVisionPrompt("ja");
    expect(prompt).toContain("locale ja");
    expect(prompt).toContain("Cameras & Optics");
    expect(prompt).toContain("Digital Cameras");
    expect(prompt).not.toContain("Romanian");
    expect(prompt).not.toContain("română");
  });

  it("parses canonical structured output", () => {
    const result = parseVisionResponse(
      JSON.stringify({
        title: "Sony mirrorless camera",
        description: "A black camera with an attached lens.",
        category_l1: "Cameras & Optics",
        category_l2: "Digital Cameras",
        confidence: 0.94,
      }),
      "en",
    );

    expect(result).toMatchObject({
      title: "Sony mirrorless camera",
      categoryL1: "Cameras & Optics",
      categoryL2: "Digital Cameras",
      confidence: 0.94,
      locale: "en",
      manualCompletionRequired: false,
    });
  });

  it("maps legacy Romanian taxonomy values to the object wizard taxonomy", () => {
    expect(resolveVisionCategory("Telefoane & Tablete", "", "iPhone smartphone")).toEqual({
      categoryL1: "Electronics",
      categoryL2: "Phones",
    });
    expect(resolveVisionCategory("Foto & Video", "", "mirrorless camera")).toEqual({
      categoryL1: "Cameras & Optics",
      categoryL2: "Digital Cameras",
    });
  });

  it("keeps the deterministic fallback language-neutral", () => {
    const fallback = fallbackVisionFromUrl(
      "https://example.com/photos/laptop-dell-2024.jpg",
      "es",
    );

    expect(fallback.title).toBe("Laptop dell");
    expect(fallback.caption).toBe("Laptop dell");
    expect(fallback.categoryL1).toBe("Electronics");
    expect(fallback.categoryL2).toBe("Computers");
    expect(fallback.locale).toBe("es");
    expect(fallback.manualCompletionRequired).toBe(true);
  });
});
