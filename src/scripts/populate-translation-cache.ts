/**
 * Populate translation cache for all items.
 *
 * Reads every item from the Supabase items table, translates title and
 * description into 5 target languages (ro, en, de, fr, it) via Claude
 * Haiku, and stores each result in the translation_cache table.
 *
 * Existing cache entries are skipped.  Rate-limited to 1 API call/s.
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
const TARGET_LANGS = ["ro", "en", "de", "fr", "it"] as const;

const LOCALE_NAMES: Record<string, string> = {
  ro: "Romanian",
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian",
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY");
  process.exit(1);
}
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ─────────────────────────────────────────────────────────

function hashText(text: string, targetLang: string): string {
  return createHash("sha256")
    .update(`${text}::${targetLang}`)
    .digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function isCached(
  textHash: string,
  targetLang: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("translation_cache")
    .select("id")
    .eq("source_text_hash", textHash)
    .eq("target_lang", targetLang)
    .maybeSingle();
  return data !== null;
}

async function translateWithClaude(
  text: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "You are a professional translator for Swaply, a global barter/swap marketplace. " +
        "Translate naturally and accurately into the target language. " +
        "Preserve the meaning in the context of object exchange and bartering. " +
        "Return ONLY the translated text, nothing else. " +
        "Do not add explanations, quotes, or prefixes.",
      messages: [
        {
          role: "user",
          content: `Translate the following from ${LOCALE_NAMES[sourceLang] ?? sourceLang} to ${LOCALE_NAMES[targetLang]}:\n\n${text}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`  Claude API ${res.status}: ${body.slice(0, 200)}`);
    return null;
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text: string }>;
  };
  return data.content?.[0]?.text?.trim() ?? null;
}

async function cacheTranslation(
  textHash: string,
  sourceLang: string,
  targetLang: string,
  translatedText: string,
): Promise<void> {
  await supabase.from("translation_cache").upsert(
    {
      source_text_hash: textHash,
      source_lang: sourceLang,
      target_lang: targetLang,
      translated_text: translatedText,
    },
    { onConflict: "source_text_hash,target_lang" },
  );
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching items from Supabase...");

  const { data: items, error } = await supabase
    .from("items")
    .select("id, title, description, category")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch items:", error.message);
    process.exit(1);
  }

  const total = items.length;
  console.log(`Found ${total} items. Target languages: ${TARGET_LANGS.join(", ")}\n`);

  let translated = 0;
  let skipped = 0;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    console.log(`Translating item ${i + 1}/${total}  [${item.id}] "${(item.title ?? "").slice(0, 50)}"`);

    const fields: Array<{ name: string; text: string }> = [];
    if (item.title) fields.push({ name: "title", text: item.title });
    if (item.description) fields.push({ name: "description", text: item.description });

    for (const lang of TARGET_LANGS) {
      for (const field of fields) {
        const hash = hashText(field.text, lang);

        if (await isCached(hash, lang)) {
          skipped++;
          continue;
        }

        const result = await translateWithClaude(field.text, lang);
        if (result) {
          await cacheTranslation(hash, "ro", lang, result);
          translated++;
          console.log(`  ✓ ${field.name} → ${lang}`);
        } else {
          console.log(`  ✗ ${field.name} → ${lang} (failed)`);
        }

        // Rate limit: 1 API call per second
        await sleep(1000);
      }
    }
  }

  console.log(`\nDone! Translated: ${translated}, Skipped (cached): ${skipped}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
