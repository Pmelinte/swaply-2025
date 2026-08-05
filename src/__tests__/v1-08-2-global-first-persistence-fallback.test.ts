import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  buildProfileLanguageFallbackChain,
  resolveProfilePreferredLocale,
} from "@/lib/i18n/languageFallback";

describe("V1-08.2 global-first persistence and fallback", () => {
  it("keeps canonical profile languages ahead of compatibility and English fallback", () => {
    const chain = buildProfileLanguageFallbackChain({
      primary_language: "ro",
      secondary_language: "fr",
      tertiary_language: "it",
      preferred_locale: "de",
      preferred_language: "es",
    });

    expect(chain.map((entry) => entry.locale)).toEqual([
      "ro",
      "fr",
      "it",
      "de",
      "en",
    ]);
    expect(chain.map((entry) => entry.source)).toEqual([
      "primary_language",
      "secondary_language",
      "tertiary_language",
      "route_locale",
      "technical_fallback",
    ]);
  });

  it("normalizes locale variants, removes duplicates and keeps English last", () => {
    const chain = buildProfileLanguageFallbackChain(
      {
        primary_language: "fr-FR",
        secondary_language: "fr",
        tertiary_language: "RO_ro",
        preferred_locale: "de-DE",
      },
      { browserLocale: "it-IT", sourceLocale: "es-ES" },
    );

    expect(chain.map((entry) => entry.locale)).toEqual([
      "fr",
      "ro",
      "it",
      "de",
      "es",
      "en",
    ]);
  });

  it("uses historical preferred language only when canonical primary is absent", () => {
    expect(
      resolveProfilePreferredLocale({
        primary_language: null,
        preferred_language: "uk-UA",
      }),
    ).toBe("uk");
  });

  it("preserves the persisted three-language profile authority", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260708000100_profile_language_preferences.sql",
      ),
      "utf8",
    );
    const stateProvider = readFileSync(
      resolve(process.cwd(), "src/lib/state/index.tsx"),
      "utf8",
    );

    for (const column of [
      "primary_language",
      "secondary_language",
      "tertiary_language",
      "auto_translate_messages",
      "show_original_language",
    ]) {
      expect(migration).toContain(column);
      expect(stateProvider).toContain(column);
    }

    expect(stateProvider).toContain("updateOwnProfileWithCompatibility");
    expect(stateProvider).toContain("canonicalPayload");
  });

  it("requires transactional email to use the shared persisted-profile resolver", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/email/swap-proposal/route.ts"),
      "utf8",
    );

    expect(route).toContain("resolveProfilePreferredLocale");
    expect(route).toContain("secondary_language");
    expect(route).toContain("tertiary_language");
    expect(route).not.toContain(
      "responder.primary_language || responder.preferred_locale",
    );
  });
});
