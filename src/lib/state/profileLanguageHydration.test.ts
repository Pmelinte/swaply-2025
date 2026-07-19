import { describe, expect, it, vi } from "vitest";
import { getProfileTranslationPreferences } from "../profile/profileTranslationPreferences";
import { createMapProfile } from "./mappers";

vi.mock("nanoid", () => ({ nanoid: () => "mock-id" }));

describe("authenticated profile language hydration", () => {
  it("hydrates the canonical primary, secondary and tertiary columns", () => {
    const mapProfile = createMapProfile({ current: null });
    const profile = mapProfile({
      user_id: "user-1",
      primary_language: "fr",
      secondary_language: "it",
      tertiary_language: "ro",
      languages: ["en", "de"],
    });

    expect(profile.languages).toEqual(["fr", "it", "ro"]);
  });

  it("restores a canonical RTL locale after login or reload", () => {
    const mapProfile = createMapProfile({ current: null });
    const profile = mapProfile({
      user_id: "user-rtl",
      primary_language: "yi",
      secondary_language: "ar",
    });

    expect(profile.languages).toEqual(["yi", "ar"]);
  });

  it("keeps the historical array only as a compatibility fallback", () => {
    const mapProfile = createMapProfile({ current: null });
    const profile = mapProfile({
      user_id: "legacy-user",
      languages: ["de", "ro", "de", "en"],
    });

    expect(profile.languages).toEqual(["de", "ro", "en"]);
  });

  it("hydrates the canonical chat translation preferences", () => {
    const mapProfile = createMapProfile({ current: null });
    const profile = mapProfile({
      user_id: "translation-user",
      auto_translate_messages: false,
      show_original_language: true,
    });

    expect(getProfileTranslationPreferences(profile)).toEqual({
      autoTranslateMessages: false,
      showOriginalLanguage: true,
    });
  });

  it("uses the database-compatible preference defaults when fields are absent", () => {
    const mapProfile = createMapProfile({ current: null });
    const profile = mapProfile({ user_id: "default-translation-user" });

    expect(getProfileTranslationPreferences(profile)).toEqual({
      autoTranslateMessages: true,
      showOriginalLanguage: false,
    });
  });
});
