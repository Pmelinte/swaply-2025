/**
 * Translate ONLY descriptions of all items into all 42 non-ro locales.
 * Skips items that already have cached description translations.
 * Titles are NOT touched — they are already translated.
 */

import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const TARGET_LANGS = [
  "en","de","fr","es","it","pt","nl","pl","el","hu","bg","cs","sk","hr",
  "sl","sr","sv","da","fi","no","lt","lv","et","ga","mt","ru","tr","ar",
  "zh","hi","bn","ja","ko","vi","th","id","ms","fil","fa","mn","uk","yi",
] as const;

const LOCALE_NAMES: Record<string, string> = {
  en: "English", de: "German", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", nl: "Dutch", pl: "Polish", el: "Greek", hu: "Hungarian",
  bg: "Bulgarian", cs: "Czech", sk: "Slovak", hr: "Croatian", sl: "Slovenian",
  sr: "Serbian", sv: "Swedish", da: "Danish", fi: "Finnish", no: "Norwegian",
  lt: "Lithuanian", lv: "Latvian", et: "Estonian", ga: "Irish", mt: "Maltese",
  ru: "Russian", tr: "Turkish", ar: "Arabic", zh: "Chinese", hi: "Hindi",
  bn: "Bengali", ja: "Japanese", ko: "Korean", vi: "Vietnamese", th: "Thai",
  id: "Indonesian", ms: "Malay", fil: "Filipino", fa: "Persian",
  mn: "Mongolian", uk: "Ukrainian", yi: "Yiddish",
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!ANTHROPIC_API_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Missing SUPABASE_URL or key"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function hashText(text: string, targetLang: string): string {
  return createHash("sha256").update(`${text}::${targetLang}`).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function isCached(hash: string, lang: string): Promise<boolean> {
  const { data } = await supabase
    .from("translation_cache")
    .select("id")
    .eq("source_text_hash", hash)
    .eq("target_lang", lang)
    .maybeSingle();
  return data !== null;
}

async function translateWithClaude(text: string, targetLang: string): Promise<string | null> {
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
      system: "You are a professional translator for Swaply, a global barter marketplace. Translate naturally and accurately. Return ONLY the translated text.",
      messages: [{
        role: "user",
        content: `Translate from Romanian to ${LOCALE_NAMES[targetLang] ?? targetLang}:\n\n${text}`,
      }],
    }),
  });
  if (!res.ok) {
    console.error(`  Claude API ${res.status}`);
    return null;
  }
  const data = (await res.json()) as { content?: Array<{ text: string }> };
  return data.content?.[0]?.text?.trim() ?? null;
}

async function main() {
  console.log("Fetching items...");
  const { data: items, error } = await supabase
    .from("items")
    .select("id, description")
    .neq("description", "")
    .not("description", "is", null)
    .order("created_at", { ascending: true });

  if (error || !items) { console.error("Failed:", error?.message); process.exit(1); }

  console.log(`Found ${items.length} items with descriptions.`);
  console.log(`Target: ${TARGET_LANGS.length} languages. ONLY descriptions.\n`);

  let translated = 0, skipped = 0, failed = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const desc = item.description as string;

    if (i % 10 === 0) {
      console.log(`Progress: ${i}/${items.length} items | translated=${translated} skipped=${skipped} failed=${failed}`);
    }

    for (const lang of TARGET_LANGS) {
      const hash = hashText(desc, lang);

      if (await isCached(hash, lang)) {
        skipped++;
        continue;
      }

      const result = await translateWithClaude(desc, lang);
      if (result) {
        await supabase.from("translation_cache").upsert(
          { source_text_hash: hash, source_lang: "ro", target_lang: lang, translated_text: result },
          { onConflict: "source_text_hash,target_lang", defaultToNull: false },
        );
        translated++;
      } else {
        failed++;
      }

      await sleep(500); // 2 calls/sec — within Haiku limits
    }
  }

  console.log(`\nDone! Translated: ${translated} | Skipped (cached): ${skipped} | Failed: ${failed}`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
