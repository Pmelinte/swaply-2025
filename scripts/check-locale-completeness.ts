#!/usr/bin/env npx ts-node
/**
 * Compares every locale JSON file against en.json (reference).
 * Exits with code 1 if any locale is missing keys.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MESSAGES_DIR = path.resolve(__dirname, "../src/messages");

function getKeys(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...getKeys(v as Record<string, unknown>, key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

const enPath = path.join(MESSAGES_DIR, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const enKeys = new Set(getKeys(en));

const files = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith(".json") && f !== "en.json");

let hasErrors = false;

for (const file of files) {
  const locale = file.replace(".json", "");
  const data = JSON.parse(
    fs.readFileSync(path.join(MESSAGES_DIR, file), "utf8"),
  );
  const localeKeys = new Set(getKeys(data));
  const missing = [...enKeys].filter((k) => !localeKeys.has(k));

  if (missing.length > 0) {
    hasErrors = true;
    console.error(`❌ ${locale}: ${missing.length} missing keys`);
    missing.slice(0, 10).forEach((k) => console.error(`   - ${k}`));
    if (missing.length > 10) {
      console.error(`   ... and ${missing.length - 10} more`);
    }
  } else {
    console.log(`✅ ${locale}: all ${enKeys.size} keys present`);
  }
}

if (hasErrors) {
  console.error("\nSome locales are incomplete. Run: node scripts/sync-translations.mjs");
  process.exit(1);
} else {
  console.log(`\n✅ All ${files.length} locale files are complete (${enKeys.size} keys each).`);
}
