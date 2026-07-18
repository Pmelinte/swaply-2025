import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "@/i18n/config";
import { getLocaleDirection, rtlLocales } from "@/i18n/direction";
import {
  buildLoggedInLanguageFallbackChain,
  buildLoggedOutLanguageFallbackChain,
  parseAcceptLanguageHeader,
  pickLocalizedValue,
  toLocaleList,
} from "./languageFallback";

describe("Batch 66 global locale contract", () => {
  it("keeps one canonical registry with exactly 43 unique locales", () => {
    expect(locales).toHaveLength(43);
    expect(new Set(locales).size).toBe(43);
    expect(locales).toContain(defaultLocale);
    expect(locales).toEqual(
      expect.arrayContaining(["en", "ro", "de", "ar", "fa", "zh", "ja", "yi"]),
    );
  });

  it("declares RTL direction only for the supported RTL locales", () => {
    expect(rtlLocales).toEqual(["ar", "fa", "yi"]);

    for (const locale of locales) {
      expect(getLocaleDirection(locale)).toBe(rtlLocales.includes(locale as "ar" | "fa" | "yi") ? "rtl" : "ltr");
    }
  });

  it("builds the logged-in chain without duplicates and keeps English technical-only", () => {
    const chain = buildLoggedInLanguageFallbackChain({
      primaryLanguage: "ro-RO",
      secondaryLanguage: "fr",
      tertiaryLanguage: "it_IT",
      browserLocale: "de-DE",
      routeLocale: "ro",
      sourceLocale: "es",
    });

    expect(toLocaleList(chain)).toEqual(["ro", "fr", "it", "de", "es", "en"]);
    expect(chain.at(-1)).toEqual({
      locale: "en",
      source: "technical_fallback",
    });
  });

  it("builds the guest chain from route, browser, region, source, then technical fallback", () => {
    const chain = buildLoggedOutLanguageFallbackChain({
      routeLocale: "fa",
      browserLocale: "zh-Hans-CN",
      regionCountryCode: "RO",
      sourceLocale: "de",
    });

    expect(toLocaleList(chain)).toEqual(["fa", "zh", "ro", "de", "en"]);
  });

  it("parses weighted browser locales and ignores unsupported languages", () => {
    expect(
      parseAcceptLanguageHeader("xx-ZZ;q=1, de-DE;q=0.7, ro-RO;q=0.9, de;q=0.8"),
    ).toEqual(["ro", "de"]);
  });

  it("picks localized content by the canonical user chain", () => {
    const chain = buildLoggedInLanguageFallbackChain({
      primaryLanguage: "ro",
      secondaryLanguage: "fr",
      tertiaryLanguage: "it",
      routeLocale: "de",
      sourceLocale: "es",
    });

    expect(
      pickLocalizedValue(
        {
          fr: "Bonjour",
          de: "Hallo",
          en: "Hello",
        },
        chain,
      ),
    ).toBe("Bonjour");
  });
});
