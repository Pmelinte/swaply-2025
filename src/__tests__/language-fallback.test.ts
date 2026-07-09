import { describe, expect, it } from "vitest";
import {
  buildLoggedInLanguageFallbackChain,
  buildLoggedOutLanguageFallbackChain,
  parseAcceptLanguageHeader,
  pickLocalizedValue,
  toLocaleList,
} from "@/lib/i18n/languageFallback";

describe("global-first language fallback", () => {
  it("prefers logged-in user language preferences before route/source/English", () => {
    const chain = buildLoggedInLanguageFallbackChain({
      primaryLanguage: "ro",
      secondaryLanguage: "fr",
      tertiaryLanguage: "it",
      routeLocale: "en",
      sourceLocale: "de",
    });

    expect(toLocaleList(chain)).toEqual(["ro", "fr", "it", "en", "de"]);
    expect(chain.at(-1)?.source).toBe("source_locale");
  });

  it("does not duplicate locales in the fallback chain", () => {
    const chain = buildLoggedInLanguageFallbackChain({
      primaryLanguage: "ro-RO",
      secondaryLanguage: "ro",
      tertiaryLanguage: "fr-FR",
      routeLocale: "fr",
      sourceLocale: "en",
    });

    expect(toLocaleList(chain)).toEqual(["ro", "fr", "en"]);
  });

  it("uses route, browser, region and source for logged-out users", () => {
    const chain = buildLoggedOutLanguageFallbackChain({
      routeLocale: "es",
      browserLocale: "fr-CA",
      regionCountryCode: "ro",
      sourceLocale: "de",
    });

    expect(toLocaleList(chain)).toEqual(["es", "fr", "ro", "de", "en"]);
  });

  it("keeps English as the last technical fallback for unsupported inputs", () => {
    const chain = buildLoggedInLanguageFallbackChain({
      primaryLanguage: "xx",
      secondaryLanguage: null,
      tertiaryLanguage: undefined,
      routeLocale: "zz-ZZ",
      sourceLocale: "ro",
    });

    expect(toLocaleList(chain)).toEqual(["ro", "en"]);
    expect(chain.at(-1)).toEqual({ locale: "en", source: "technical_fallback" });
  });

  it("parses Accept-Language order and normalizes supported locales", () => {
    expect(parseAcceptLanguageHeader("de-AT,de;q=0.9,ro;q=0.8,en-US;q=0.7")).toEqual([
      "de",
      "ro",
      "en",
    ]);
  });

  it("selects localized values using the computed chain", () => {
    const chain = buildLoggedInLanguageFallbackChain({
      primaryLanguage: "ro",
      secondaryLanguage: "fr",
      tertiaryLanguage: "it",
      routeLocale: "en",
    });

    expect(
      pickLocalizedValue(
        {
          fr: "Bonjour",
          en: "Hello",
        },
        chain,
      ),
    ).toBe("Bonjour");
  });
});
