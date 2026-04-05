#!/usr/bin/env node

/**
 * Full i18n audit script.
 *
 * PART 1: Hardcoded user-visible strings in .tsx files
 * PART 2: Key coverage across all 43 locale files
 * PART 3: translation_cache coverage for all items (requires Supabase)
 * PART 4: Per-locale summary
 *
 * Output: audit-reports/full-audit-YYYY-MM-DD.txt
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, extname, basename } from "path";

const MESSAGES_DIR = "src/messages";
const SRC_DIRS = ["src/app", "src/components", "src/features"];
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const now = new Date();
const dateStr = now.toISOString().slice(0, 10);
const outDir = "audit-reports";
const outPath = join(outDir, `full-audit-${dateStr}.txt`);

mkdirSync(outDir, { recursive: true });

const lines = [];
function log(msg = "") { lines.push(msg); console.log(msg); }

// ── Helpers ──

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

function getNestedValue(obj, path) {
  return path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function walk(dir) {
  const results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        if (statSync(full).isDirectory()) {
          results.push(...walk(full));
        } else if (full.endsWith(".tsx") && !full.includes(".test.") && !full.includes("node_modules")) {
          results.push(full);
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return results;
}

// ══════════════════════════════════════════════════════
log("═══════════════════════════════════════════════════");
log("  FULL i18n AUDIT REPORT");
log(`  Generated: ${now.toISOString()}`);
log("═══════════════════════════════════════════════════");
log();

// ── PART 1: Hardcoded strings ──
log("══ PART 1: HARDCODED USER-VISIBLE STRINGS ══");
log();

const EXCLUDE_PATTERNS = [
  /className/, /import\s/, /from\s+["']/, /export\s/, /href=/, /src=/,
  /key=/, /type=/, /console\./, /aria-/, /data-/, /rel=/, /method=/,
  /target=/, /sizes=/, /alt=/, /NODE_ENV/, /process\./, /schema\.org/,
  /Content-Type/, /Bearer/, /application\//, /StateShowcase/, /admin\//,
  /\.test\./, /messages\//, /interface\s/, /@context/, /@type/,
];

const STRING_RE = /"([A-Z][a-z]{2,}[^"]*?)"/g;
let hardcodedCount = 0;
const hardcodedFindings = [];

for (const dir of SRC_DIRS) {
  for (const file of walk(dir)) {
    const content = readFileSync(file, "utf-8");
    const fileLines = content.split("\n");
    const relPath = relative(".", file);

    for (let i = 0; i < fileLines.length; i++) {
      const line = fileLines[i];
      // Skip lines matching exclude patterns
      if (EXCLUDE_PATTERNS.some((p) => p.test(line))) continue;
      // Skip comment lines
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;

      let match;
      STRING_RE.lastIndex = 0;
      while ((match = STRING_RE.exec(line)) !== null) {
        const str = match[1];
        // Skip short strings, URLs, CSS values, technical strings
        if (str.length < 4) continue;
        if (str.includes("http") || str.includes("/api/") || str.includes(".")) continue;
        if (str.startsWith("bg-") || str.startsWith("text-")) continue;

        hardcodedCount++;
        hardcodedFindings.push({ file: relPath, line: i + 1, text: str.slice(0, 60) });
      }
    }
  }
}

log(`Found ${hardcodedCount} potential hardcoded strings:`);
log();
for (const f of hardcodedFindings.slice(0, 50)) {
  log(`  ${f.file}:${f.line}  "${f.text}"`);
}
if (hardcodedFindings.length > 50) {
  log(`  ... +${hardcodedFindings.length - 50} more`);
}
log();

// ── PART 2: Key coverage ──
log("══ PART 2: KEY COVERAGE ACROSS ALL 43 LOCALES ══");
log();

const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf-8"));
const enKeys = flatten(en);
const enKeySet = new Set(enKeys);
log(`Baseline: en.json with ${enKeys.length} keys`);
log();

const localeFiles = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json")).sort();
const localeSummary = {};

let totalMissing = 0;
let totalUntranslated = 0;

for (const file of localeFiles) {
  const locale = basename(file, ".json");
  const data = JSON.parse(readFileSync(join(MESSAGES_DIR, file), "utf-8"));
  const locKeys = new Set(flatten(data));

  const missing = enKeys.filter((k) => !locKeys.has(k));
  let untranslated = 0;

  if (locale !== "en") {
    for (const key of enKeys) {
      if (locKeys.has(key)) {
        const enVal = getNestedValue(en, key);
        const locVal = getNestedValue(data, key);
        if (enVal === locVal && typeof enVal === "string" && enVal.length > 3) {
          untranslated++;
        }
      }
    }
  }

  const translated = enKeys.length - missing.length - untranslated;
  const pct = ((translated / enKeys.length) * 100).toFixed(1);

  localeSummary[locale] = {
    total: enKeys.length,
    missing: missing.length,
    untranslated,
    translated,
    pct,
  };

  totalMissing += missing.length;
  totalUntranslated += untranslated;

  if (missing.length > 0 || (untranslated > 10 && locale !== "en")) {
    log(`  ${locale}: ${pct}% translated | ${missing.length} missing | ${untranslated} untranslated (English fallback)`);
    if (missing.length > 0) {
      for (const m of missing.slice(0, 5)) {
        log(`    MISSING: ${m}`);
      }
    }
  }
}

log();
log(`Total missing keys across all locales: ${totalMissing}`);
log(`Total untranslated (English fallback): ${totalUntranslated}`);
log();

// ── PART 3: translation_cache coverage ──
log("══ PART 3: TRANSLATION CACHE COVERAGE ══");
log();

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    // Fetch items
    const itemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/items?select=id,title,description&status=eq.active&order=created_at.asc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    const items = await itemsRes.json();

    // Fetch cache counts per lang
    const cacheRes = await fetch(
      `${SUPABASE_URL}/rest/v1/translation_cache?select=target_lang`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Prefer: "count=exact",
        },
      },
    );
    const cacheTotal = parseInt(cacheRes.headers?.get("content-range")?.split("/")[1] ?? "0", 10);

    log(`Active items: ${items.length}`);
    log(`Translation cache entries: ${cacheTotal}`);
    log(`Expected (${items.length} items × 2 fields × 42 langs): ${items.length * 2 * 42}`);
    log(`Coverage: ${((cacheTotal / (items.length * 2 * 42)) * 100).toFixed(1)}%`);
    log();

    // Sample check: first 5 items
    log("Sample items:");
    for (const item of items.slice(0, 5)) {
      log(`  ${item.id} | "${(item.title ?? "").slice(0, 40)}"`);
    }
  } catch (err) {
    log(`⚠ Could not query Supabase: ${err.message}`);
  }
} else {
  log("⚠ SUPABASE_URL/KEY not set — skipping cache coverage check");
  log("  Set SUPABASE_URL and SUPABASE_ANON_KEY to enable this check");
}
log();

// ── PART 4: Per-locale summary ──
log("══ PART 4: PER-LOCALE SUMMARY ══");
log();
log("Locale | Total | Translated | Missing | Untranslated | Coverage");
log("-------|-------|------------|---------|-------------|--------");

for (const [locale, s] of Object.entries(localeSummary).sort((a, b) => a[0].localeCompare(b[0]))) {
  log(
    `${locale.padEnd(6)} | ${String(s.total).padStart(5)} | ${String(s.translated).padStart(10)} | ${String(s.missing).padStart(7)} | ${String(s.untranslated).padStart(11)} | ${s.pct}%`,
  );
}

log();
log("═══════════════════════════════════════════════════");
log("  END OF AUDIT REPORT");
log("═══════════════════════════════════════════════════");

// Write to file
writeFileSync(outPath, lines.join("\n"), "utf-8");
console.log(`\nReport saved to: ${outPath}`);
