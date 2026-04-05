#!/usr/bin/env node

/**
 * Translate all English-fallback keys in all 43 locale files.
 * Reads en.json as source, finds keys where locale value === en value,
 * translates via Claude Haiku, writes back to locale file.
 *
 * Requires: ANTHROPIC_API_KEY environment variable
 *
 * Usage: node scripts/translate-all-locale-keys.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

const MESSAGES_DIR = "src/messages";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}

const LOCALE_NAMES = {
  ar:"Arabic",bg:"Bulgarian",bn:"Bengali",cs:"Czech",da:"Danish",de:"German",
  el:"Greek",es:"Spanish",et:"Estonian",fa:"Persian",fi:"Finnish",fil:"Filipino",
  fr:"French",ga:"Irish",hi:"Hindi",hr:"Croatian",hu:"Hungarian",id:"Indonesian",
  it:"Italian",ja:"Japanese",ko:"Korean",lt:"Lithuanian",lv:"Latvian",mn:"Mongolian",
  ms:"Malay",mt:"Maltese",nl:"Dutch",no:"Norwegian",pl:"Polish",pt:"Portuguese",
  ro:"Romanian",ru:"Russian",sk:"Slovak",sl:"Slovenian",sr:"Serbian",sv:"Swedish",
  th:"Thai",tr:"Turkish",uk:"Ukrainian",vi:"Vietnamese",yi:"Yiddish",zh:"Chinese",
};

function flatten(obj, prefix = "") {
  const entries = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      entries.push(...flatten(v, full));
    } else {
      entries.push([full, v]);
    }
  }
  return entries;
}

function setNested(obj, path, value) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function getNested(obj, path) {
  return path.split(".").reduce((o, k) => (o && typeof o === "object" ? o[k] : undefined), obj);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(texts, targetLang) {
  const langName = LOCALE_NAMES[targetLang] ?? targetLang;
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system: `You are a professional translator for a web application. Translate each numbered line from English to ${langName}. Return ONLY the translated lines in the same numbered format. Keep proper nouns (Swaply, Premium, Platinum) unchanged. Keep technical terms (AI, escrow) as-is or use the standard term in ${langName}.`,
      messages: [{ role: "user", content: numbered }],
    }),
  });

  if (!res.ok) {
    console.error(`  Claude API error: ${res.status}`);
    return null;
  }

  const data = await res.json();
  const output = data.content?.[0]?.text?.trim() ?? "";

  // Parse numbered lines back
  const results = [];
  const lineRe = /^\d+\.\s*(.+)$/gm;
  let match;
  while ((match = lineRe.exec(output)) !== null) {
    results.push(match[1].trim());
  }
  return results.length === texts.length ? results : null;
}

async function main() {
  const en = JSON.parse(readFileSync(join(MESSAGES_DIR, "en.json"), "utf-8"));
  const enEntries = flatten(en);

  const localeFiles = readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json") && f !== "en.json")
    .sort();

  let totalTranslated = 0;
  let totalFailed = 0;

  for (const file of localeFiles) {
    const locale = basename(file, ".json");
    const filePath = join(MESSAGES_DIR, file);
    const data = JSON.parse(readFileSync(filePath, "utf-8"));

    // Find keys with English fallback (value === en value)
    const untranslated = [];
    for (const [key, enVal] of enEntries) {
      if (typeof enVal !== "string" || enVal.length <= 3) continue;
      const locVal = getNested(data, key);
      if (locVal === enVal) {
        untranslated.push({ key, text: enVal });
      }
    }

    if (untranslated.length === 0) {
      console.log(`✓ ${locale}: fully translated`);
      continue;
    }

    console.log(`${locale}: ${untranslated.length} keys to translate...`);

    // Translate in batches of 20
    const BATCH = 20;
    for (let i = 0; i < untranslated.length; i += BATCH) {
      const batch = untranslated.slice(i, i + BATCH);
      const texts = batch.map((b) => b.text);

      const results = await translateBatch(texts, locale);

      if (results) {
        for (let j = 0; j < batch.length; j++) {
          setNested(data, batch[j].key, results[j]);
        }
        totalTranslated += batch.length;
        process.stdout.write(`  ${i + batch.length}/${untranslated.length}\r`);
      } else {
        totalFailed += batch.length;
        console.log(`  ✗ Batch ${i}-${i + BATCH} failed`);
      }

      await sleep(500);
    }

    // Write back
    writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    console.log(`  ✓ ${locale}: ${untranslated.length} keys translated`);
  }

  console.log(`\nDone! Translated: ${totalTranslated} | Failed: ${totalFailed}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
