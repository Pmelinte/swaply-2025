/**
 * Populate translation cache for all items — BATCHED version.
 *
 * Sends up to 20 texts in a single Claude Haiku API call per language,
 * drastically reducing cost (~$1.50 instead of ~$8).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... \
 *   SUPABASE_URL=https://... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx src/scripts/populate-translation-cache.ts
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

// ── Config ──────────────────────────────────────────────────────────
const TARGET_LANGS = [
  "en","de","fr","es","it","pt","nl","pl","el","hu","bg","cs","sk","hr",
  "sl","sr","sv","da","fi","no","lt","lv","et","ga","mt","ru","tr","ar",
  "zh","hi","bn","ja","ko","vi","th","id","ms","fil","fa","mn","uk","yi",
] as const;

const LOCALE_NAMES: Record<string, string> = {
  en: "English", ro: "Romanian", fr: "French", de: "German",
  es: "Spanish", it: "Italian", pt: "Portuguese", nl: "Dutch",
  pl: "Polish", el: "Greek", hu: "Hungarian", bg: "Bulgarian",
  cs: "Czech", sk: "Slovak", hr: "Croatian", sl: "Slovenian",
  sr: "Serbian", sv: "Swedish", da: "Danish", fi: "Finnish",
  no: "Norwegian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  ga: "Irish", mt: "Maltese", ru: "Russian", tr: "Turkish",
  ar: "Arabic", zh: "Chinese", hi: "Hindi", bn: "Bengali",
  ja: "Japanese", ko: "Korean", vi: "Vietnamese", th: "Thai",
  id: "Indonesian", ms: "Malay", fil: "Filipino", fa: "Persian",
  mn: "Mongolian", uk: "Ukrainian", yi: "Yiddish",
};

const BATCH_SIZE = 20; // texts per API call

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Missing SUPABASE_URL or key"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ─────────────────────────────────────────────────────────

function hashText(text: string, targetLang: string): string {
  return createHash("sha256").update(`${text}::${targetLang}`).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface TextEntry {
  index: number;
  text: string;
  hash: string;
  itemId: string;
  field: string;
}

async function getExistingHashes(hashes: string[], lang: string): Promise<Set<string>> {
  // Check in batches of 100 to avoid query limits
  const existing = new Set<string>();
  for (let i = 0; i < hashes.length; i += 100) {
    const batch = hashes.slice(i, i + 100);
    const { data } = await supabase
      .from("translation_cache")
      .select("source_text_hash")
      .in("source_text_hash", batch)
      .eq("target_lang", lang);
    if (data) {
      for (const row of data) existing.add(row.source_text_hash);
    }
  }
  return existing;
}

async function translateBatch(
  texts: string[],
  targetLang: string,
): Promise<string[] | null> {
  // Build numbered list for batch translation
  const numbered = texts.map((t, i) => `[${i + 1}] ${t}`).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system:
        "You are a translator for Swaply, a barter marketplace. " +
        "Translate each numbered item. Return ONLY the translations in the same numbered format: [1] translation\\n[2] translation\\n... " +
        "Keep the [N] numbering. Do not add explanations.",
      messages: [{
        role: "user",
        content: `Translate from Romanian to ${LOCALE_NAMES[targetLang] ?? targetLang}:\n\n${numbered}`,
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`  API ${res.status}: ${body.slice(0, 200)}`);
    return null;
  }

  const data = (await res.json()) as { content?: Array<{ text: string }> };
  const responseText = data.content?.[0]?.text?.trim();
  if (!responseText) return null;

  // Parse numbered responses: [1] text, [2] text, ...
  const results: string[] = [];
  const lines = responseText.split("\n");
  let currentIdx = -1;
  let currentText = "";

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.*)/);
    if (match) {
      if (currentIdx >= 0) {
        results[currentIdx] = currentText.trim();
      }
      currentIdx = parseInt(match[1]) - 1;
      currentText = match[2];
    } else if (currentIdx >= 0) {
      currentText += "\n" + line;
    }
  }
  if (currentIdx >= 0) {
    results[currentIdx] = currentText.trim();
  }

  // Verify we got all translations
  if (results.filter(Boolean).length !== texts.length) {
    console.error(`  Expected ${texts.length} translations, got ${results.filter(Boolean).length}`);
    return null;
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching items from Supabase...");

  const { data: items, error } = await supabase
    .from("items")
    .select("id, title, description")
    .order("created_at", { ascending: true });

  if (error || !items) {
    console.error("Failed to fetch items:", error?.message);
    process.exit(1);
  }

  // Build flat list of all texts to translate
  const allTexts: TextEntry[] = [];
  for (const item of items) {
    if (item.title) {
      allTexts.push({ index: 0, text: item.title, hash: "", itemId: item.id, field: "title" });
    }
    if (item.description) {
      allTexts.push({ index: 0, text: item.description, hash: "", itemId: item.id, field: "desc" });
    }
  }

  console.log(`Found ${items.length} items, ${allTexts.length} text fields.`);
  console.log(`Target: ${TARGET_LANGS.length} languages, batch size: ${BATCH_SIZE}`);
  console.log(`Max translations: ${allTexts.length * TARGET_LANGS.length}`);
  console.log(`Estimated API calls: ~${Math.ceil(allTexts.length / BATCH_SIZE) * TARGET_LANGS.length} (batched)\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;
  let apiCalls = 0;

  for (const lang of TARGET_LANGS) {
    console.log(`\n── ${LOCALE_NAMES[lang]} (${lang}) ──`);

    // Compute hashes for this language
    const entries = allTexts.map((e) => ({
      ...e,
      hash: hashText(e.text, lang),
    }));

    // Bulk check which are already cached
    const existingHashes = await getExistingHashes(
      entries.map((e) => e.hash),
      lang,
    );

    const uncached = entries.filter((e) => !existingHashes.has(e.hash));
    skipped += entries.length - uncached.length;

    if (uncached.length === 0) {
      console.log(`  All ${entries.length} already cached, skipping.`);
      continue;
    }

    console.log(`  Need to translate: ${uncached.length} (${entries.length - uncached.length} cached)`);

    // Process in batches
    for (let b = 0; b < uncached.length; b += BATCH_SIZE) {
      const batch = uncached.slice(b, b + BATCH_SIZE);
      const batchTexts = batch.map((e) => e.text);

      // Retry up to 3 times
      let results: string[] | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        results = await translateBatch(batchTexts, lang);
        apiCalls++;
        if (results) break;
        console.log(`  ⟳ retry batch ${Math.floor(b / BATCH_SIZE) + 1} (attempt ${attempt + 2}/3)`);
        await sleep(2000 * (attempt + 1));
      }

      if (results) {
        // Store all translations
        const rows = batch.map((entry, i) => ({
          source_text_hash: entry.hash,
          source_lang: "ro",
          target_lang: lang,
          translated_text: results![i],
        }));

        const { error: upsertErr } = await supabase
          .from("translation_cache")
          .upsert(rows, { onConflict: "source_text_hash,target_lang" });

        if (upsertErr) {
          console.error(`  Upsert error: ${upsertErr.message}`);
          failed += batch.length;
        } else {
          translated += batch.length;
        }
      } else {
        failed += batch.length;
        console.error(`  ✗ Batch failed after 3 attempts`);
      }

      // Rate limit between batches
      await sleep(600);
    }

    console.log(`  ✓ ${lang} done | total: ${translated} translated, ${skipped} skipped, ${failed} failed`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`DONE!`);
  console.log(`  Translated: ${translated}`);
  console.log(`  Skipped (cached): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  API calls: ${apiCalls} (batched ${BATCH_SIZE}/call)`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
