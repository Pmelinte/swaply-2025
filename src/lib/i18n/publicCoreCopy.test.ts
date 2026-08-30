import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import { SWAP_STATUSES } from "@/lib/swaps/lifecycle";
import {
  getLocalizedSwapStatus,
  getPublicCoreCopy,
  publicCoreCopy,
} from "@/i18n/public-core-copy";

describe("global public core i18n contract", () => {
  it("provides native public-core copy for every registered locale", () => {
    expect(Object.keys(publicCoreCopy)).toHaveLength(43);
    expect(Object.keys(publicCoreCopy).sort()).toEqual([...locales].sort());

    const english = getPublicCoreCopy("en");

    for (const locale of locales) {
      const copy = getPublicCoreCopy(locale);

      expect(copy.preview.trim().length).toBeGreaterThan(0);
      expect(copy.matchingDescription.trim().length).toBeGreaterThan(20);
      expect(copy.messagesDescription.trim().length).toBeGreaterThan(20);
      expect(copy.exchangeDescription.trim().length).toBeGreaterThan(20);

      if (locale !== "en") {
        expect(copy.matchingDescription).not.toBe(english.matchingDescription);
        expect(copy.messagesDescription).not.toBe(english.messagesDescription);
        expect(copy.exchangeDescription).not.toBe(english.exchangeDescription);
      }
    }
  });

  it("localizes every canonical exchange status for every locale", () => {
    for (const locale of locales) {
      const copy = getPublicCoreCopy(locale);
      expect(Object.keys(copy.statuses).sort()).toEqual([...SWAP_STATUSES].sort());

      for (const status of SWAP_STATUSES) {
        expect(copy.statuses[status].trim().length).toBeGreaterThan(0);
        expect(getLocalizedSwapStatus(locale, status)).toBe(copy.statuses[status]);
      }
    }
  });

  it("falls back safely only for an unsupported route locale", () => {
    expect(getPublicCoreCopy("xx")).toBe(publicCoreCopy.en);
    expect(getPublicCoreCopy("ro-RO")).toBe(publicCoreCopy.ro);
  });
});
