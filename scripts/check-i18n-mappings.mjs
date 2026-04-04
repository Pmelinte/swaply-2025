#!/usr/bin/env node

/**
 * Check that condition values used in code map to existing i18n keys
 * in the "objects" namespace, and that category slugs map to keys
 * in the "categories" namespace.
 *
 * Exits with code 1 if any mapping is missing.
 */

import { readFileSync } from "fs";
import { join } from "path";

const MESSAGES_DIR = "src/messages";
const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf-8"));

const objectsNs = en.objects ?? {};
const categoriesNs = en.categories ?? {};

let failures = 0;

// ── Check condition keys ──
const CONDITIONS = ["new", "like_new", "good", "fair", "poor", "used", "used_good"];
console.log("=== Condition key mapping ===");
for (const cond of CONDITIONS) {
  const key = `condition_${cond}`;
  if (objectsNs[key]) {
    console.log(`  ✓ objects.${key} = "${objectsNs[key]}"`);
  } else {
    console.log(`  ✗ MISSING: objects.${key}`);
    failures++;
  }
}

// ── Check category slug keys ──
const CATEGORY_SLUGS = [
  "electronics", "sports_outdoor", "hobby_games", "books_media",
  "home_garden", "fashion_accessories", "auto_moto", "music_audio",
  "gardening_outdoor", "toys_kids", "tools_diy", "vehicles",
  "experiences", "medical", "other",
  // SEO slugs used in some components
  "sport", "arts", "books", "home", "fashion", "automotive",
  "music", "garden", "toys", "tools",
];

console.log("\n=== Category slug key mapping ===");
for (const slug of CATEGORY_SLUGS) {
  if (categoriesNs[slug]) {
    console.log(`  ✓ categories.${slug} = "${categoriesNs[slug]}"`);
  } else {
    console.log(`  ✗ MISSING: categories.${slug}`);
    failures++;
  }
}

if (failures > 0) {
  console.log(`\n✗ ${failures} missing condition/category mappings`);
  process.exit(1);
} else {
  console.log("\n✓ All condition and category keys mapped correctly");
}
