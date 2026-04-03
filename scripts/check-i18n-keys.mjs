#!/usr/bin/env node

/**
 * Check that every key in en.json exists in all other 42 locale files.
 * Exits with code 1 if any locale is missing keys.
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const MESSAGES_DIR = "src/messages";

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

const enPath = join(MESSAGES_DIR, "en.json");
const en = JSON.parse(readFileSync(enPath, "utf-8"));
const enKeys = new Set(flatten(en));

console.log(`✓ en.json: ${enKeys.size} keys\n`);

const files = readdirSync(MESSAGES_DIR).filter(
  (f) => f.endsWith(".json") && f !== "en.json",
);

let totalMissing = 0;

for (const file of files.sort()) {
  const locale = file.replace(".json", "");
  const data = JSON.parse(readFileSync(join(MESSAGES_DIR, file), "utf-8"));
  const locKeys = new Set(flatten(data));
  const missing = [...enKeys].filter((k) => !locKeys.has(k));

  if (missing.length > 0) {
    totalMissing += missing.length;
    console.log(
      `FAIL: ${file} missing ${missing.length} keys: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ` ... +${missing.length - 5} more` : ""}`,
    );
  }
}

if (totalMissing > 0) {
  console.log(`\n✗ ${totalMissing} missing keys across ${files.length} locale files`);
  process.exit(1);
} else {
  console.log(`✓ All ${files.length} locale files have complete key coverage`);
}
