import { describe, expect, it } from "vitest";
import {
  promoteProfileLanguage,
  resolveProfileLanguages,
} from "./profileLanguagePreferences";

describe("resolveProfileLanguages", () => {
  it("prefers canonical profile columns and keeps ordered fallbacks", () => {
    expect(resolveProfileLanguages({
      primary_language: "fr",
      secondary_language: "it",
      tertiary_language: "ro",
      languages: ["en", "de"],
    })).toEqual(["fr", "it", "ro"]);
  });

  it("uses the historical languages array when canonical columns are absent", () => {
    expect(resolveProfileLanguages({ languages: ["de", "ro", "de", "en"] }))
      .toEqual(["de", "ro", "en"]);
  });

  it("accepts every canonical locale including Yiddish and rejects unknown values", () => {
    expect(resolveProfileLanguages({
      primary_language: "yi",
      secondary_language: "xx",
      tertiary_language: "ar",
    })).toEqual(["yi", "ar"]);
  });

  it("uses a supported fallback and finally English", () => {
    expect(resolveProfileLanguages({}, "uk")).toEqual(["uk"]);
    expect(resolveProfileLanguages({}, "invalid")).toEqual(["en"]);
  });
});

describe("promoteProfileLanguage", () => {
  it("promotes the selected locale without duplicates", () => {
    expect(promoteProfileLanguage("it", ["ro", "it", "fr"]))
      .toEqual(["it", "ro", "fr"]);
  });

  it("keeps at most three supported preferences", () => {
    expect(promoteProfileLanguage("yi", ["xx", "ar", "fr", "de"]))
      .toEqual(["yi", "ar", "fr"]);
  });
});
