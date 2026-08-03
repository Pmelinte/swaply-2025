import {describe, expect, it} from "vitest";
import {
  buildLocalizedJourneyReturn,
  buildOAuthCallbackUrl,
  sanitizeJourneyReturn,
} from "../lib/auth/journeyReturn";

describe("authenticated journey return", () => {
  it("keeps a safe internal destination and strips an existing locale", () => {
    expect(sanitizeJourneyReturn("/de/services/abc?from=matching#offer")).toBe(
      "/services/abc?from=matching#offer",
    );
  });

  it.each([
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "profile",
  ])("fails unsafe destinations closed: %s", (target) => {
    expect(sanitizeJourneyReturn(target)).toBe("/profile");
  });

  it("reapplies the active locale exactly once", () => {
    expect(buildLocalizedJourneyReturn("ar", "/de/events/123?intent=interest")).toBe(
      "/ar/events/123?intent=interest",
    );
  });

  it("falls back to English for an invalid locale token", () => {
    expect(buildLocalizedJourneyReturn("../../evil", "/profile")).toBe("/en/profile");
  });

  it("carries the localized destination through the OAuth callback", () => {
    const callback = new URL(
      buildOAuthCallbackUrl(
        "https://www.swaply.world",
        "fr",
        "/properties/abc?intent=reserve",
      ),
    );

    expect(callback.origin).toBe("https://www.swaply.world");
    expect(callback.pathname).toBe("/auth/callback");
    expect(callback.searchParams.get("next")).toBe(
      "/fr/properties/abc?intent=reserve",
    );
  });
});
