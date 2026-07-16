import { describe, expect, it } from "vitest";
import { resolveLanguageFallback } from "./languageFallbackPolicy";

describe("Batch 65 ordered global-first language fallback", () => {
  it("uses primary, secondary and tertiary before route, browser, source and English", () => {
    const result = resolveLanguageFallback({
      primaryLocale: "ro",
      secondaryLocale: "fr",
      tertiaryLocale: "it",
      routeLocale: "de",
      browserLocale: "es",
      sourceLocale: "en",
      availableLocales: ["en", "it", "de"],
      defaultLocale: "en",
      surface: "blog",
    });

    expect(result.resolvedLocale).toBe("it");
    expect(result.fallbackMode).toBe("user_tertiary");
    expect(result.attemptedLocales).toEqual(["ro", "fr", "it"]);
    expect(result.translationNeeded).toBe(true);
  });

  it("uses route, browser and source order for a guest without profile preferences", () => {
    const route = resolveLanguageFallback({
      routeLocale: "ja",
      browserLocale: "fr",
      sourceLocale: "en",
      availableLocales: ["en", "fr", "ja"],
      defaultLocale: "en",
      surface: "public_page",
    });
    expect(route.resolvedLocale).toBe("ja");
    expect(route.fallbackMode).toBe("route_locale");

    const browser = resolveLanguageFallback({
      routeLocale: "ja",
      browserLocale: "fr",
      sourceLocale: "en",
      availableLocales: ["en", "fr"],
      defaultLocale: "en",
      surface: "public_page",
    });
    expect(browser.resolvedLocale).toBe("fr");
    expect(browser.fallbackMode).toBe("browser_locale");

    const source = resolveLanguageFallback({
      routeLocale: "ja",
      browserLocale: "fr",
      sourceLocale: "en",
      availableLocales: ["en"],
      defaultLocale: "en",
      surface: "public_page",
    });
    expect(source.resolvedLocale).toBe("en");
    expect(source.fallbackMode).toBe("source_locale");
  });

  it("uses English only after the complete canonical chain is exhausted", () => {
    const result = resolveLanguageFallback({
      primaryLocale: "ro",
      secondaryLocale: "fr",
      tertiaryLocale: "it",
      routeLocale: "de",
      browserLocale: "es",
      sourceLocale: "ja",
      availableLocales: ["en"],
      defaultLocale: "en",
      surface: "matching",
    });

    expect(result.resolvedLocale).toBe("en");
    expect(result.fallbackMode).toBe("default_global");
    expect(result.attemptedLocales).toEqual(["ro", "fr", "it", "de", "es", "ja", "en"]);
  });

  it("deduplicates repeated locale candidates without changing precedence", () => {
    const result = resolveLanguageFallback({
      primaryLocale: "ro",
      secondaryLocale: "ro",
      tertiaryLocale: "fr",
      routeLocale: "fr",
      browserLocale: "en",
      sourceLocale: "en",
      availableLocales: ["en", "fr"],
      defaultLocale: "en",
      surface: "chat",
    });

    expect(result.resolvedLocale).toBe("fr");
    expect(result.fallbackMode).toBe("user_tertiary");
    expect(result.attemptedLocales).toEqual(["ro", "fr"]);
    expect(result.shouldShowOriginal).toBe(true);
  });

  it("keeps language-family compatibility for regional content", () => {
    const result = resolveLanguageFallback({
      routeLocale: "pt-BR",
      availableLocales: ["pt-PT", "en"],
      defaultLocale: "en",
      surface: "item_listing",
    });

    expect(result.resolvedLocale).toBe("pt-pt");
    expect(result.fallbackMode).toBe("language_family");
  });
});
