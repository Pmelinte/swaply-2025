import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import {
  buildCanonicalLanguagePayload,
  buildProfileLanguageFallbackRequest,
  DEFAULT_PROFILE_VISIBILITY,
  isValidIanaTimezone,
  mapGlobalProfileContract,
  normalizeProfileLanguagePreferences,
  normalizeProfileLocale,
} from "./profileContract";

describe("Batch 65 application profile contract", () => {
  it("normalizes all 43 active locales and regional variants", () => {
    expect(locales).toHaveLength(43);

    for (const locale of locales) {
      expect(normalizeProfileLocale(locale)).toBe(locale);
    }

    expect(normalizeProfileLocale("RO_ro")).toBe("ro");
    expect(normalizeProfileLocale("pt-BR")).toBe("pt");
    expect(normalizeProfileLocale("unsupported")).toBeNull();
  });

  it("derives primary, secondary and tertiary languages in deterministic order", () => {
    const preferences = normalizeProfileLanguagePreferences({
      primary_language: null,
      preferred_locale: "fr",
      languages: ["fr", "ro", "it", "ro"],
      auto_translate_messages: false,
      show_original_language: true,
    }, "de");

    expect(preferences).toEqual({
      primary: "fr",
      secondary: "ro",
      tertiary: "it",
      autoTranslateMessages: false,
      showOriginalLanguage: true,
    });
  });

  it("uses route then global fallback only when stored preferences are absent", () => {
    expect(normalizeProfileLanguagePreferences({}, "ja").primary).toBe("ja");
    expect(normalizeProfileLanguagePreferences({}, "invalid").primary).toBe("en");
  });

  it("maps revision, global profile controls and privacy defaults", () => {
    const contract = mapGlobalProfileContract({
      user_id: "9ab2fb31-c996-4543-8246-9a82efcefd8f",
      profile_revision: "4",
      primary_language: "ro",
      secondary_language: "fr",
      tertiary_language: "it",
      user_type: "professional",
      availability_status: "limited",
      timezone: "Europe/Bucharest",
      visibility: {
        publicProfile: false,
        showBio: true,
      },
    });

    expect(contract.userId).toBe("9ab2fb31-c996-4543-8246-9a82efcefd8f");
    expect(contract.revision).toBe(4);
    expect(contract.userType).toBe("professional");
    expect(contract.availabilityStatus).toBe("limited");
    expect(contract.timezone).toBe("Europe/Bucharest");
    expect(contract.visibility).toEqual({
      ...DEFAULT_PROFILE_VISIBILITY,
      publicProfile: false,
      showBio: true,
    });
    expect(contract.legacyLanguages).toEqual(["ro", "fr", "it"]);
  });

  it("builds the canonical logged-in fallback request", () => {
    const contract = mapGlobalProfileContract({
      user_id: "7d60ee20-14cb-4564-a4a0-992251b11315",
      primary_language: "ro",
      secondary_language: "fr",
      tertiary_language: "it",
    });

    expect(buildProfileLanguageFallbackRequest(contract, {
      availableLocales: ["en", "it"],
      surface: "blog",
      routeLocale: "de",
      browserLocale: "es",
      sourceLocale: "en",
    })).toMatchObject({
      primaryLocale: "ro",
      secondaryLocale: "fr",
      tertiaryLocale: "it",
      routeLocale: "de",
      browserLocale: "es",
      sourceLocale: "en",
      defaultLocale: "en",
      surface: "blog",
    });
  });

  it("serializes distinct language preferences and rejects duplicates", () => {
    expect(buildCanonicalLanguagePayload({
      primary: "ro",
      secondary: "fr",
      tertiary: "it",
      autoTranslateMessages: true,
      showOriginalLanguage: false,
    })).toEqual({
      primary_language: "ro",
      secondary_language: "fr",
      tertiary_language: "it",
      auto_translate_messages: true,
      show_original_language: false,
    });

    expect(() => buildCanonicalLanguagePayload({
      primary: "ro",
      secondary: "ro",
      tertiary: null,
      autoTranslateMessages: true,
      showOriginalLanguage: false,
    })).toThrow("Profile languages must be distinct");
  });

  it("validates IANA timezones without maintaining a second timezone registry", () => {
    expect(isValidIanaTimezone("Europe/Bucharest")).toBe(true);
    expect(isValidIanaTimezone("UTC")).toBe(true);
    expect(isValidIanaTimezone("Mars/Olympus")).toBe(false);
  });
});
