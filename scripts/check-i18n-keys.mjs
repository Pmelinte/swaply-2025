#!/usr/bin/env node

/**
 * Validate the canonical Swaply internationalization contract.
 *
 * The check is deliberately provider-free and deterministic:
 * - the locale registry in src/i18n/config.ts is the source of truth;
 * - every registered locale must have exactly one JSON message catalogue;
 * - every English leaf key must resolve locally or through the runtime English
 *   technical fallback already implemented in src/i18n/request.ts;
 * - translated values must preserve the English leaf type;
 * - ICU-style variable placeholders must match the English source.
 *
 * The repository still contains documented historical debt:
 * - canonical `chat.*` leaves not yet translated in all 41 non-source
 *   catalogues are supplied by the existing deep English technical fallback;
 * - older flat namespaces such as `chatAgenda.*` and `chatDrawer.*` remain for
 *   legacy call sites and are reported as extra keys;
 * - five pre-existing translations renamed ICU variables.
 *
 * These remain visible warnings so this gate blocks new regressions without
 * forcing a destructive or machine-translated rewrite of 41 catalogues in a
 * single batch. Extra translated keys are warnings for the same reason.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MESSAGES_DIR = "src/messages";
const LOCALE_CONFIG_PATH = "src/i18n/config.ts";
const EXPECTED_LOCALE_COUNT = 43;
const KNOWN_TECHNICAL_FALLBACK_PREFIXES = ["chat."];

const KNOWN_PLACEHOLDER_DEBT = new Set([
  "it:desk.deadlineProposalExpires",
  "it:desk.taskLeaveReview",
  "it:desk.taskRespondProposal",
  "it:desk.taskStartSwap",
  "sl:objectDetail.photoCount",
]);

function readRegisteredLocales() {
  const source = readFileSync(LOCALE_CONFIG_PATH, "utf-8");
  const match = source.match(/export const locales\s*=\s*\[([\s\S]*?)\]\s*as const/);

  if (!match) {
    throw new Error(`Unable to read the locale registry from ${LOCALE_CONFIG_PATH}`);
  }

  const locales = [...match[1].matchAll(/["']([a-z]{2,3})["']/g)].map(
    (entry) => entry[1],
  );

  if (locales.length !== new Set(locales).size) {
    throw new Error("The locale registry contains duplicate locale codes");
  }

  return locales;
}

function flattenLeaves(value, prefix = "", result = new Map()) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flattenLeaves(child, prefix ? `${prefix}.${key}` : key, result);
    }
    return result;
  }

  result.set(prefix, value);
  return result;
}

function extractPlaceholders(value) {
  if (typeof value !== "string") return [];

  const placeholders = new Set();
  for (const match of value.matchAll(/\{\s*([A-Za-z_][A-Za-z0-9_.-]*)\s*(?:[,}])/g)) {
    placeholders.add(match[1]);
  }

  return [...placeholders].sort();
}

function sameStringList(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function formatSample(values, limit = 6) {
  if (values.length <= limit) return values.join(", ");
  return `${values.slice(0, limit).join(", ")} ... +${values.length - limit} more`;
}

function isKnownTechnicalFallbackKey(key) {
  return KNOWN_TECHNICAL_FALLBACK_PREFIXES.some((prefix) => key.startsWith(prefix));
}

const registeredLocales = readRegisteredLocales();
const localeFiles = readdirSync(MESSAGES_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => file.replace(/\.json$/, ""))
  .sort();

const failures = [];
const warnings = [];

if (registeredLocales.length !== EXPECTED_LOCALE_COUNT) {
  failures.push(
    `Locale registry contains ${registeredLocales.length} locales; expected ${EXPECTED_LOCALE_COUNT}`,
  );
}

const missingFiles = registeredLocales.filter((locale) => !localeFiles.includes(locale));
const unregisteredFiles = localeFiles.filter((locale) => !registeredLocales.includes(locale));

if (missingFiles.length > 0) {
  failures.push(`Missing locale files: ${formatSample(missingFiles)}`);
}
if (unregisteredFiles.length > 0) {
  failures.push(`Unregistered locale files: ${formatSample(unregisteredFiles)}`);
}

if (!registeredLocales.includes("en")) {
  failures.push("The canonical English source locale is not registered");
}

const catalogues = new Map();
for (const locale of registeredLocales) {
  const path = join(MESSAGES_DIR, `${locale}.json`);
  try {
    catalogues.set(locale, JSON.parse(readFileSync(path, "utf-8")));
  } catch (error) {
    failures.push(`${locale}.json cannot be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const englishCatalogue = catalogues.get("en");
if (!englishCatalogue) {
  failures.push("The canonical English catalogue could not be loaded");
} else {
  const englishLeaves = flattenLeaves(englishCatalogue);
  const englishKeys = [...englishLeaves.keys()].sort();

  console.log(`✓ Locale registry: ${registeredLocales.length}/${EXPECTED_LOCALE_COUNT}`);
  console.log(`✓ en.json: ${englishKeys.length} leaf keys`);

  for (const locale of registeredLocales) {
    const catalogue = catalogues.get(locale);
    if (!catalogue) continue;

    const leaves = flattenLeaves(catalogue);
    const keys = [...leaves.keys()].sort();
    const missing = [];
    const technicalFallbackKeys = [];
    const typeMismatches = [];
    const placeholderMismatches = [];
    const knownPlaceholderWarnings = [];
    const emptyValues = [];

    for (const key of englishKeys) {
      if (!leaves.has(key)) {
        if (locale !== "en" && isKnownTechnicalFallbackKey(key)) {
          technicalFallbackKeys.push(key);
        } else {
          missing.push(key);
        }
        continue;
      }

      const sourceValue = englishLeaves.get(key);
      const translatedValue = leaves.get(key);
      const sourceType = Array.isArray(sourceValue) ? "array" : typeof sourceValue;
      const translatedType = Array.isArray(translatedValue) ? "array" : typeof translatedValue;

      if (sourceType !== translatedType) {
        typeMismatches.push(`${key} (${sourceType} -> ${translatedType})`);
        continue;
      }

      if (
        typeof sourceValue === "string" &&
        sourceValue.trim().length > 0 &&
        typeof translatedValue === "string" &&
        translatedValue.trim().length === 0
      ) {
        emptyValues.push(key);
      }

      const sourcePlaceholders = extractPlaceholders(sourceValue);
      const translatedPlaceholders = extractPlaceholders(translatedValue);
      if (!sameStringList(sourcePlaceholders, translatedPlaceholders)) {
        const mismatch = `${key} ({${sourcePlaceholders.join(",")}} -> {${translatedPlaceholders.join(",")}})`;
        if (KNOWN_PLACEHOLDER_DEBT.has(`${locale}:${key}`)) {
          knownPlaceholderWarnings.push(mismatch);
        } else {
          placeholderMismatches.push(mismatch);
        }
      }
    }

    const extra = keys.filter((key) => !englishLeaves.has(key));

    if (missing.length > 0) {
      failures.push(`${locale}.json missing ${missing.length} unapproved keys: ${formatSample(missing)}`);
    }
    if (typeMismatches.length > 0) {
      failures.push(
        `${locale}.json has ${typeMismatches.length} type mismatches: ${formatSample(typeMismatches)}`,
      );
    }
    if (placeholderMismatches.length > 0) {
      failures.push(
        `${locale}.json has ${placeholderMismatches.length} placeholder mismatches: ${formatSample(placeholderMismatches)}`,
      );
    }
    if (emptyValues.length > 0) {
      failures.push(
        `${locale}.json has ${emptyValues.length} empty values: ${formatSample(emptyValues)}`,
      );
    }
    if (technicalFallbackKeys.length > 0) {
      warnings.push(
        `${locale}.json uses the documented English technical fallback for ${technicalFallbackKeys.length} canonical chat keys: ${formatSample(technicalFallbackKeys)}`,
      );
    }
    if (knownPlaceholderWarnings.length > 0) {
      warnings.push(
        `${locale}.json retains ${knownPlaceholderWarnings.length} documented placeholder debt item(s): ${formatSample(knownPlaceholderWarnings)}`,
      );
    }
    if (extra.length > 0) {
      warnings.push(`${locale}.json has ${extra.length} historical extra keys: ${formatSample(extra)}`);
    }

    if (
      missing.length === 0 &&
      typeMismatches.length === 0 &&
      placeholderMismatches.length === 0 &&
      emptyValues.length === 0
    ) {
      console.log(`✓ ${locale}.json: runtime-resolvable key, type and placeholder contract`);
    }
  }
}

for (const warning of warnings) {
  console.warn(`WARN: ${warning}`);
}

if (failures.length > 0) {
  console.error(`\n✗ i18n contract failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(`\n✓ Swaply i18n contract PASS for all ${registeredLocales.length} locales`);
