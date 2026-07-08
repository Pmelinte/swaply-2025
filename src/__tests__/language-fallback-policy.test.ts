import { describe, expect, it } from "vitest";
import {
  canHideOriginalChatMessage,
  canRenderPublicPageWithoutExactTranslation,
  getLanguageFamily,
  getTranslationDisplayPolicy,
  normalizeLocale,
  normalizeLocaleList,
  resolveLanguageFallback,
  shouldBlockPageForMissingTranslation,
} from "@/lib/language-fallback/languageFallbackPolicy";
import { LANGUAGE_FALLBACK_EXAMPLES } from "@/lib/language-fallback/languageFallbackSeeds";
import { CORE_PUBLIC_LOCALES, GLOBAL_DEFAULT_LOCALE, TRANSLATION_SURFACES } from "@/lib/language-fallback/languageFallbackTypes";

describe("language fallback policy", () => {
  it("defines core public locale metadata", () => {
    expect(GLOBAL_DEFAULT_LOCALE).toBe("en");
    expect(CORE_PUBLIC_LOCALES).toEqual(["en", "ro", "fr", "es", "de"]);
    expect(TRANSLATION_SURFACES).toContain("chat");
    expect(TRANSLATION_SURFACES).toContain("legal");
  });

  it("normalizes locale values", () => {
    expect(normalizeLocale("RO_ro")).toBe("ro-ro");
    expect(getLanguageFamily("pt-BR")).toBe("pt");
    expect(normalizeLocaleList(["EN", "en", "ro"])).toEqual(["en", "ro"]);
  });

  it("resolves exact locale when available", () => {
    const result = resolveLanguageFallback(LANGUAGE_FALLBACK_EXAMPLES[0]);

    expect(result.resolvedLocale).toBe("ro");
    expect(result.fallbackMode).toBe("exact_locale");
    expect(result.pageCanRender).toBe(true);
    expect(result.translationNeeded).toBe(false);
  });

  it("falls back to the same language family", () => {
    const result = resolveLanguageFallback(LANGUAGE_FALLBACK_EXAMPLES[1]);

    expect(result.resolvedLocale).toBe("pt-pt");
    expect(result.fallbackMode).toBe("language_family");
    expect(result.shouldShowOriginal).toBe(true);
    expect(result.translationNeeded).toBe(true);
  });

  it("uses user preferred locale before global default", () => {
    const result = resolveLanguageFallback(LANGUAGE_FALLBACK_EXAMPLES[2]);

    expect(result.resolvedLocale).toBe("de");
    expect(result.fallbackMode).toBe("user_preferred_locale");
    expect(result.pageCanRender).toBe(true);
  });

  it("uses original content fallback when no locale is available", () => {
    const result = resolveLanguageFallback(LANGUAGE_FALLBACK_EXAMPLES[3]);

    expect(result.resolvedLocale).toBe("en");
    expect(result.fallbackMode).toBe("original_content");
    expect(result.pageCanRender).toBe(true);
  });

  it("never blocks public pages only because translation is missing", () => {
    expect(canRenderPublicPageWithoutExactTranslation()).toBe(true);
    expect(shouldBlockPageForMissingTranslation()).toBe(false);
  });

  it("preserves original chat messages", () => {
    const result = resolveLanguageFallback(LANGUAGE_FALLBACK_EXAMPLES[4]);
    const policy = getTranslationDisplayPolicy("chat");

    expect(result.shouldShowOriginal).toBe(true);
    expect(policy.mustPreserveOriginal).toBe(true);
    expect(canHideOriginalChatMessage()).toBe(false);
  });

  it("requires human review for legal translations", () => {
    const policy = getTranslationDisplayPolicy("legal");

    expect(policy.canUseMachineTranslation).toBe(false);
    expect(policy.mustPreserveOriginal).toBe(true);
    expect(policy.requiresHumanReview).toBe(true);
  });
});
