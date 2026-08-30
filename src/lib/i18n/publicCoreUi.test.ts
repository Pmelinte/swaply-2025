import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { getPublicCoreUi, publicCoreUi } from "@/i18n/public-core-ui";

const textFields = [
  "preview",
  "login",
  "matchingTitle",
  "messagesTitle",
  "exchangeTitle",
  "explore",
  "browseAll",
  "filters",
  "addObject",
  "conversations",
  "secureChat",
  "matchingDescription",
  "messagesDescription",
  "exchangeDescription",
] as const;

describe("global public core native UI contract", () => {
  it("covers exactly every registered locale", () => {
    expect(Object.keys(publicCoreUi)).toHaveLength(43);
    expect(Object.keys(publicCoreUi).sort()).toEqual([...locales].sort());
  });

  it("provides every visible public-core string for every locale", () => {
    for (const locale of locales) {
      const copy = getPublicCoreUi(locale);
      for (const field of textFields) {
        expect(copy[field].trim().length, `${locale}.${field}`).toBeGreaterThan(0);
      }
      expect(copy.matchingDescription.length).toBeGreaterThan(20);
      expect(copy.messagesDescription.length).toBeGreaterThan(20);
      expect(copy.exchangeDescription.length).toBeGreaterThan(20);
    }
  });

  it("normalizes regional locale tags and safely handles unsupported locales", () => {
    expect(getPublicCoreUi("ro-RO")).toBe(publicCoreUi.ro);
    expect(getPublicCoreUi("fr-FR")).toBe(publicCoreUi.fr);
    expect(getPublicCoreUi("xx")).toBe(publicCoreUi.en);
  });
});
