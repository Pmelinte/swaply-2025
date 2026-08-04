import { describe, expect, it } from "vitest";
import { locales } from "../i18n/config";
import { getLocaleDirection, rtlLocales } from "../i18n/direction";
import {
  buildLocalizedPath,
  formatDateTime,
  formatMoney,
  normalizeCountry,
  normalizeCurrency,
  resolveLocale,
  resolveLocaleChain,
} from "../i18n/globalContext";

describe("global-first locale contract", () => {
  it("keeps the canonical registry at exactly 43 unique locales", () => {
    expect(locales).toHaveLength(43);
    expect(new Set(locales).size).toBe(43);
  });

  it("accepts locale variants and falls back to English only at the end", () => {
    expect(resolveLocale("RO_ro")).toBe("ro");
    expect(resolveLocale("ar-SA")).toBe("ar");
    expect(resolveLocale("unknown")).toBe("en");
    expect(resolveLocaleChain("fr-FR", "ro_RO", "fr")).toEqual([
      "fr",
      "ro",
      "en",
    ]);
    expect(resolveLocaleChain("zz-ZZ", "ro_RO")).toEqual(["ro", "en"]);
    expect(resolveLocaleChain(null, 42, "fr-FR", undefined)).toEqual([
      "fr",
      "en",
    ]);
    expect(resolveLocaleChain("en", "ro", "en")).toEqual(["ro", "en"]);
  });

  it("keeps every canonical locale in a stable localized path", () => {
    for (const locale of locales) {
      expect(buildLocalizedPath(locale, "exchange/swap-1")).toBe(
        `/${locale}/exchange/swap-1`,
      );
    }
  });
});

describe("global-first direction contract", () => {
  it("marks exactly Arabic, Persian and Yiddish as RTL", () => {
    expect(rtlLocales).toEqual(["ar", "fa", "yi"]);
    for (const locale of locales) {
      expect(getLocaleDirection(locale)).toBe(
        rtlLocales.includes(locale as (typeof rtlLocales)[number])
          ? "rtl"
          : "ltr",
      );
    }
  });
});

describe("country and currency contract", () => {
  it("normalizes valid ISO-shaped country and currency codes", () => {
    expect(normalizeCountry(" ro ")).toBe("RO");
    expect(normalizeCountry("rom")).toBeNull();
    expect(normalizeCurrency(" eur ")).toBe("EUR");
    expect(normalizeCurrency("EURO")).toBeNull();
  });

  it("formats money and date values with normalized untyped input", () => {
    expect(formatMoney(1234.5, "eur", "de-DE")).toContain("1.234,50");
    expect(formatMoney(1234.5, { invalid: true }, ["bad-locale"])).toContain(
      "€",
    );
    expect(
      formatDateTime("2026-08-04T12:30:00.000Z", "fr-FR", {
        timeZone: "UTC",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    ).not.toBe("");
    expect(formatDateTime("invalid", "ro")).toBe("");
  });
});
