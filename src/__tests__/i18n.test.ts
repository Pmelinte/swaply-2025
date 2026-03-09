import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const messagesDir = path.resolve(__dirname, "../messages");

function loadJSON(filename: string): Record<string, unknown> {
  const filePath = path.join(messagesDir, filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

describe("i18n translation files", () => {
  const localeFiles = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
  const en = loadJSON("en.json");
  const enKeys = flattenKeys(en).sort();

  it("has en.json as reference", () => {
    expect(localeFiles).toContain("en.json");
  });

  it("has ro.json", () => {
    expect(localeFiles).toContain("ro.json");
  });

  it("has at least 40 locale files", () => {
    expect(localeFiles.length).toBeGreaterThanOrEqual(40);
  });

  it("en.json is valid JSON with content", () => {
    expect(Object.keys(en).length).toBeGreaterThan(0);
    expect(enKeys.length).toBeGreaterThan(50);
  });

  // Check each locale file for completeness
  for (const file of localeFiles) {
    if (file === "en.json") continue;

    describe(`${file}`, () => {
      it("is valid JSON", () => {
        expect(() => loadJSON(file)).not.toThrow();
      });

      it("has all top-level sections from en.json", () => {
        const locale = loadJSON(file);
        const enSections = Object.keys(en);
        const localeSections = Object.keys(locale);
        for (const section of enSections) {
          expect(localeSections, `Missing section: ${section}`).toContain(section);
        }
      });

      it("has reasonable content (no more than 10% empty values)", () => {
        const locale = loadJSON(file);
        const keys = flattenKeys(locale);
        let emptyCount = 0;
        for (const key of keys) {
          const parts = key.split(".");
          let val: unknown = locale;
          for (const p of parts) {
            val = (val as Record<string, unknown>)[p];
          }
          if (typeof val === "string" && val.length === 0) {
            emptyCount++;
          }
        }
        const emptyPercent = (emptyCount / keys.length) * 100;
        expect(emptyPercent, `${emptyCount}/${keys.length} keys are empty`).toBeLessThan(10);
      });
    });
  }

  // ro.json specific checks
  describe("ro.json completeness", () => {
    it("has all keys from en.json", () => {
      const ro = loadJSON("ro.json");
      const roKeys = flattenKeys(ro).sort();
      const missingKeys = enKeys.filter((k) => !roKeys.includes(k));
      expect(missingKeys, `Missing keys in ro.json: ${missingKeys.join(", ")}`).toEqual([]);
    });
  });

  // Check for specific required sections
  describe("required sections in en.json", () => {
    const sections = ["common", "login", "home", "objects", "chat", "profile", "feedback", "info"];
    for (const section of sections) {
      it(`has ${section} section`, () => {
        expect(en).toHaveProperty(section);
      });
    }
  });

  // Check specific new keys added in recent features
  describe("new feature translation keys", () => {
    const newKeys = [
      "chat.shareLocation",
      "chat.reactions",
      "login.strengthWeak",
      "login.strengthStrong",
      "home.trendingItems",
      "home.activityFeed",
      "objects.undoSwipe",
      "objects.loadMoreItems",
      "myObjects.exportCsv",
      "myObjects.bulkPause",
      "feedback.featureVoting",
      "feedback.uploadScreenshot",
      "change.profileCompleteness",
      "change.loginHistory",
      "info.successStories",
      "info.costCalculator",
      "legal.tableOfContents",
      "legal.lastUpdated",
    ];

    for (const key of newKeys) {
      it(`en.json has key: ${key}`, () => {
        const parts = key.split(".");
        let val: unknown = en;
        for (const p of parts) {
          val = (val as Record<string, unknown>)?.[p];
        }
        expect(val, `Missing key: ${key}`).toBeTruthy();
      });
    }
  });

  // Character encoding checks
  describe("character encoding", () => {
    it("ro.json preserves diacritics", () => {
      const ro = loadJSON("ro.json");
      const allText = JSON.stringify(ro);
      // Romanian diacritics should be present
      expect(allText).toMatch(/[ăâîșț]/i);
    });

    it("all files are valid UTF-8", () => {
      for (const file of localeFiles) {
        expect(() => {
          const content = fs.readFileSync(path.join(messagesDir, file), "utf-8");
          JSON.parse(content);
        }).not.toThrow();
      }
    });
  });
});
