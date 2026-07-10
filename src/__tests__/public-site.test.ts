import { describe, expect, it } from "vitest";
import {
  SWAPLY_PUBLIC_BASE_URL,
  SWAPLY_PUBLIC_DOMAIN,
  buildPublicHreflangLanguages,
  normalizePublicPath,
  toSwaplyLocalizedPublicUrl,
  toSwaplyPublicUrl,
  toSwaplyXDefaultPublicUrl,
} from "@/lib/public-site";

describe("canonical public site helpers", () => {
  it("keeps the canonical public domain on www.swaply.world", () => {
    expect(SWAPLY_PUBLIC_DOMAIN).toBe("www.swaply.world");
    expect(SWAPLY_PUBLIC_BASE_URL).toBe("https://www.swaply.world");
  });

  it("normalizes public paths without duplicating slashes", () => {
    expect(normalizePublicPath()).toBe("");
    expect(normalizePublicPath("")).toBe("");
    expect(normalizePublicPath("/")).toBe("/");
    expect(normalizePublicPath("objects")).toBe("/objects");
    expect(normalizePublicPath("/objects")).toBe("/objects");
  });

  it("builds canonical public URLs", () => {
    expect(toSwaplyPublicUrl()).toBe("https://www.swaply.world");
    expect(toSwaplyPublicUrl("/")).toBe("https://www.swaply.world");
    expect(toSwaplyPublicUrl("objects")).toBe("https://www.swaply.world/objects");
    expect(toSwaplyPublicUrl("/objects")).toBe("https://www.swaply.world/objects");
  });

  it("builds localized canonical public URLs", () => {
    expect(toSwaplyLocalizedPublicUrl("en")).toBe("https://www.swaply.world/en");
    expect(toSwaplyLocalizedPublicUrl("ro", "/")).toBe("https://www.swaply.world/ro");
    expect(toSwaplyLocalizedPublicUrl("fr", "objects")).toBe("https://www.swaply.world/fr/objects");
    expect(toSwaplyLocalizedPublicUrl("de", "/privacy")).toBe("https://www.swaply.world/de/privacy");
  });

  it("builds non-localized x-default public URLs", () => {
    expect(toSwaplyXDefaultPublicUrl()).toBe("https://www.swaply.world");
    expect(toSwaplyXDefaultPublicUrl("/")).toBe("https://www.swaply.world");
    expect(toSwaplyXDefaultPublicUrl("objects")).toBe("https://www.swaply.world/objects");
    expect(toSwaplyXDefaultPublicUrl("/privacy")).toBe("https://www.swaply.world/privacy");
  });

  it("builds hreflang language maps with a non-localized x-default fallback", () => {
    expect(buildPublicHreflangLanguages(["en", "ro"], "/privacy")).toEqual({
      en: "https://www.swaply.world/en/privacy",
      ro: "https://www.swaply.world/ro/privacy",
      "x-default": "https://www.swaply.world/privacy",
    });
  });
});
