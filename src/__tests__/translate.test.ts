import { describe, it, expect, vi, beforeEach } from "vitest";
import { isValidLocale } from "@/lib/translate";

describe("isValidLocale", () => {
  it("returns true for supported locales", () => {
    expect(isValidLocale("en")).toBe(true);
    expect(isValidLocale("ro")).toBe(true);
    expect(isValidLocale("fr")).toBe(true);
    expect(isValidLocale("de")).toBe(true);
    expect(isValidLocale("ja")).toBe(true);
    expect(isValidLocale("zh")).toBe(true);
  });

  it("returns false for unsupported locales", () => {
    expect(isValidLocale("xx")).toBe(false);
    expect(isValidLocale("")).toBe(false);
    expect(isValidLocale("eng")).toBe(false);
    expect(isValidLocale("english")).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isValidLocale("EN")).toBe(false);
    expect(isValidLocale("Ro")).toBe(false);
  });
});

describe("translateText", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null when ANTHROPIC_API_KEY is not set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { translateText } = await import("@/lib/translate");
    const result = await translateText("Hello", "de");
    expect(result).toBeNull();
  });

  it("returns original text when source and target are the same", async () => {
    const { translateText } = await import("@/lib/translate");
    const result = await translateText("Hello", "en", "en");
    expect(result).toBe("Hello");
  });

  it("returns null for empty text", async () => {
    const { translateText } = await import("@/lib/translate");
    const result = await translateText("", "ro");
    expect(result).toBeNull();
  });

  it("returns null for whitespace-only text", async () => {
    const { translateText } = await import("@/lib/translate");
    const result = await translateText("   ", "ro");
    expect(result).toBeNull();
  });
});

describe("translateItemContent", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("returns null fields when API key is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { translateItemContent } = await import("@/lib/translate");
    const result = await translateItemContent("Title", "Description", "de");
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
  });

  it("returns null description when description is empty", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    const { translateItemContent } = await import("@/lib/translate");
    const result = await translateItemContent("Title", "", "de");
    expect(result.description).toBeNull();
  });
});
