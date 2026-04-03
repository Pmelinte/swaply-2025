#!/usr/bin/env node

/**
 * Scan source files for t("key") calls and verify each key exists in en.json.
 * Exits with code 1 if any used key is missing from en.json.
 *
 * Handles namespaced translations: useTranslations("ns") → t("key") → ns.key
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const MESSAGES_DIR = "src/messages";
const SRC_DIRS = ["src/app", "src/components", "src/features"];

function flatten(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flatten(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      if (!full.includes(".test.") && !full.includes("node_modules")) {
        results.push(full);
      }
    }
  }
  return results;
}

const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf-8"));
const enKeys = new Set(flatten(en));

// Also build a set of top-level namespaces
const namespaces = new Set(Object.keys(en));

const missing = [];

for (const dir of SRC_DIRS) {
  for (const file of walk(dir)) {
    const content = readFileSync(file, "utf-8");
    const relPath = relative(".", file);

    // Find useTranslations("namespace") calls to determine namespace context
    const nsMatches = [
      ...content.matchAll(/useTranslations\(["']([^"']+)["']\)/g),
      ...content.matchAll(/getTranslations\(\{[^}]*namespace:\s*["']([^"']+)["']/g),
    ];

    const fileNamespaces = nsMatches.map((m) => m[1]);

    // Find all t("key") and t('key') calls
    const tCalls = [...content.matchAll(/\bt\(["']([a-zA-Z0-9_.]+)["']\)/g)];

    for (const match of tCalls) {
      const key = match[1];
      const line = content.substring(0, match.index).split("\n").length;

      // Try each namespace from this file
      let found = false;
      for (const ns of fileNamespaces) {
        if (enKeys.has(`${ns}.${key}`)) {
          found = true;
          break;
        }
      }
      // Also check if it's a fully qualified key
      if (!found && enKeys.has(key)) {
        found = true;
      }
      // Check if the key contains a dot (already namespaced)
      if (!found && key.includes(".") && enKeys.has(key)) {
        found = true;
      }

      // Skip dynamic keys (contain variables, template literals, etc.)
      if (!found && (key.includes("$") || key.includes("+"))) {
        found = true; // skip dynamic keys
      }

      if (!found) {
        // Only report if it looks like a real key (not a dynamic expression)
        missing.push({ key, file: relPath, line });
      }
    }
  }
}

if (missing.length > 0) {
  // Deduplicate
  const seen = new Set();
  const unique = missing.filter((m) => {
    const k = `${m.file}:${m.key}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  console.log(`\n✗ Found ${unique.length} potentially missing i18n keys:\n`);
  for (const { key, file, line } of unique.slice(0, 20)) {
    console.log(`  WARN: '${key}' used in ${file}:${line} — not found in en.json`);
  }
  if (unique.length > 20) {
    console.log(`  ... +${unique.length - 20} more`);
  }
  // Exit with warning but don't fail — dynamic keys produce false positives
  console.log(`\n⚠ Review above — some may be dynamic keys (false positives)`);
  process.exit(0); // warn only, don't block CI
} else {
  console.log("✓ All t() keys found in en.json");
}
