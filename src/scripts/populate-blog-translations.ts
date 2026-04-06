/**
 * Pre-translate ALL blog content into all 42 non-en locales.
 *
 * Reads every .mdx blog post, extracts translatable lines (headings,
 * paragraphs, list items), and populates the translation_cache table
 * using the same hash format as translateOnDemand.
 *
 * Uses batching (5 texts per API call) with rate-limit-safe pacing.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... \
 *   SUPABASE_URL=https://... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx src/scripts/populate-blog-translations.ts
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

// ── Config ──────────────────────────────────────────────────────────
const TARGET_LANGS = [
  "ro","de","fr","es","it","pt","nl","pl","el","hu","bg","cs","sk","hr",
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

const BATCH_SIZE = 5;
const BLOG_DIR = join(process.cwd(), "src", "content", "blog");

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

/**
 * Extract all translatable text segments from a blog MDX file.
 * This mirrors the logic in translateContent() from the blog page:
 * - Split on \n
 * - Skip empty lines, code blocks, HTML, images, horizontal rules
 * - Strip leading markdown markers (##, -, *, >) and translate the text part
 *
 * We store the STRIPPED text (without markers) because that's what
 * translateOnDemand receives from the blog page.
 */
function extractTranslatableTexts(content: string): string[] {
  const lines = content.split(/\n/);
  const texts = new Set<string>();
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Track code blocks
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    // Skip HTML, images, horizontal rules
    if (trimmed.startsWith("<") || trimmed.startsWith("![") || trimmed === "---") continue;

    // Strip leading whitespace + markdown markers (##, -, *, >)
    const leadingMatch = line.match(/^(\s*(?:[-*>]+\s*|#{1,6}\s+)?)/);
    const leading = leadingMatch ? leadingMatch[1] : "";
    const textPart = line.slice(leading.length).trim();

    if (textPart) {
      texts.add(textPart);
    }
  }

  return Array.from(texts);
}

async function getExistingHashes(hashes: string[], lang: string): Promise<Set<string>> {
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
        "You are a translator for Swaply, a barter marketplace blog. " +
        "Translate each numbered item naturally. Return ONLY the translations in the same numbered format: [1] translation\\n[2] translation\\n... " +
        "Keep the [N] numbering. Do not add explanations. Preserve any markdown formatting within the text (bold, links, etc).",
      messages: [{
        role: "user",
        content: `Translate from English to ${LOCALE_NAMES[targetLang] ?? targetLang}:\n\n${numbered}`,
      }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`  API ${res.status}: ${body.slice(0, 200)}`);
    // Signal 429 specifically so caller can apply longer backoff
    if (res.status === 429) throw new Error("RATE_LIMITED");
    return null;
  }

  const data = (await res.json()) as { content?: Array<{ text: string }> };
  const responseText = data.content?.[0]?.text?.trim();
  if (!responseText) return null;

  // Parse numbered responses
  const results: string[] = [];
  const lines = responseText.split("\n");
  let currentIdx = -1;
  let currentText = "";

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.*)/);
    if (match) {
      if (currentIdx >= 0) results[currentIdx] = currentText.trim();
      currentIdx = parseInt(match[1]) - 1;
      currentText = match[2];
    } else if (currentIdx >= 0) {
      currentText += "\n" + line;
    }
  }
  if (currentIdx >= 0) results[currentIdx] = currentText.trim();

  if (results.filter(Boolean).length !== texts.length) {
    console.error(`  Expected ${texts.length} translations, got ${results.filter(Boolean).length}`);
    return null;
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  // Read all blog posts
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`Found ${files.length} blog posts.`);

  // Collect ALL unique translatable texts across all posts
  const allTexts = new Set<string>();

  for (const file of files) {
    const raw = readFileSync(join(BLOG_DIR, file), "utf-8");
    const { data: frontmatter, content } = matter(raw);

    // Add frontmatter fields
    if (frontmatter.title) allTexts.add(frontmatter.title);
    if (frontmatter.description) allTexts.add(frontmatter.description);

    // Add content lines
    const contentTexts = extractTranslatableTexts(content);
    for (const t of contentTexts) allTexts.add(t);
  }

  const textsArray = Array.from(allTexts);
  console.log(`Unique translatable texts: ${textsArray.length}`);
  console.log(`Target: ${TARGET_LANGS.length} languages, batch size: ${BATCH_SIZE}`);
  console.log(`Max translations: ${textsArray.length * TARGET_LANGS.length}`);
  console.log(`Estimated API calls: ~${Math.ceil(textsArray.length / BATCH_SIZE) * TARGET_LANGS.length} (batched)\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;
  let apiCalls = 0;

  for (const lang of TARGET_LANGS) {
    console.log(`\n── ${LOCALE_NAMES[lang]} (${lang}) ──`);

    // Compute hashes
    const entries = textsArray.map((text) => ({
      text,
      hash: hashText(text, lang),
    }));

    // Bulk check cache
    const existingHashes = await getExistingHashes(entries.map((e) => e.hash), lang);
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

      let results: string[] | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          results = await translateBatch(batchTexts, lang);
          apiCalls++;
          if (results) break;
          console.log(`  ⟳ retry batch (attempt ${attempt + 2}/3)`);
          await sleep(5000 * Math.pow(2, attempt)); // 5s, 10s, 20s
        } catch (err: unknown) {
          apiCalls++;
          const isRateLimit = err instanceof Error && err.message === "RATE_LIMITED";
          const backoff = isRateLimit ? 5000 * Math.pow(2, attempt) : 3000;
          console.log(`  ⟳ ${isRateLimit ? "rate limited" : "error"}, waiting ${backoff / 1000}s (attempt ${attempt + 2}/3)`);
          await sleep(backoff);
        }
      }

      if (results) {
        const rows = batch.map((entry, i) => ({
          source_text_hash: entry.hash,
          source_lang: "en",
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

      // 2s delay between batches to stay under rate limits
      await sleep(2000);
    }

    console.log(`  ✓ ${lang} done | total: ${translated} translated, ${skipped} skipped, ${failed} failed`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`BLOG TRANSLATIONS DONE!`);
  console.log(`  Translated: ${translated}`);
  console.log(`  Skipped (cached): ${skipped}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  API calls: ${apiCalls} (batched ${BATCH_SIZE}/call)`);
  console.log(`${"=".repeat(60)}`);
}

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
