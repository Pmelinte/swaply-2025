/// <reference types="vite/client" />

import { describe, expect, it } from "vitest";
import { locales, type Locale } from "@/i18n/config";
import { applyLegacyI18nAliases } from "@/i18n/runtime-compat";
import { getBatch57Messages } from "@/i18n/batch57-locales";
import batch57EnglishJson from "@/i18n/fragments/batch57.en.json";

type Messages = Record<string, unknown>;

const catalogueModules = import.meta.glob<{ default: Messages }>(
  "../../messages/*.json",
  { eager: true },
);

function deepMerge(target: Messages, source: Messages): Messages {
  const result = { ...source };
  for (const key of Object.keys(target)) {
    const targetValue = target[key];
    const sourceValue = source[key];
    if (
      targetValue &&
      sourceValue &&
      typeof targetValue === "object" &&
      typeof sourceValue === "object" &&
      !Array.isArray(targetValue) &&
      !Array.isArray(sourceValue)
    ) {
      result[key] = deepMerge(
        targetValue as Messages,
        sourceValue as Messages,
      );
    } else {
      result[key] = targetValue;
    }
  }
  return result;
}

function flatten(value: unknown, prefix = "", result = new Map<string, unknown>()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, result);
    }
  } else {
    result.set(prefix, value);
  }
  return result;
}

function readMessages(locale: Locale): Messages {
  const path = `../../messages/${locale}.json`;
  const catalogueModule = catalogueModules[path];
  if (!catalogueModule) {
    throw new Error(`Missing locale catalogue module: ${path}`);
  }
  return catalogueModule.default;
}

const batch57English = batch57EnglishJson as Messages;
const english = deepMerge(batch57English, readMessages("en"));
const englishLeaves = flatten(english);

const TARGET_PREFIXES = [
  "common.apply",
  "common.saved",
  "matching.",
  "chat.",
  "guidedMatchConversation.",
  "matchAgreement.",
] as const;

function isTarget(key: string) {
  return TARGET_PREFIXES.some((prefix) =>
    prefix.endsWith(".") ? key.startsWith(prefix) : key === prefix,
  );
}

describe("native runtime coverage for the global matching/messages/exchange core", () => {
  for (const locale of locales) {
    if (locale === "en") continue;

    it(`${locale} resolves every targeted English key before final English fallback`, () => {
      const raw = readMessages(locale);
      const aliased = applyLegacyI18nAliases(raw);
      const localizedBatch57 = getBatch57Messages(locale, batch57English);
      const nativeRuntime = deepMerge(localizedBatch57, aliased);
      const nativeLeaves = flatten(nativeRuntime);

      const missing = [...englishLeaves.keys()].filter(
        (key) => isTarget(key) && !nativeLeaves.has(key),
      );

      expect(missing, `${locale} native missing: ${missing.join(", ")}`).toEqual([]);
    });
  }
});
