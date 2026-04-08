import "server-only";

import { createHash } from "crypto";
import { after } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { translateText } from "@/lib/translate";

/** Get a Supabase client — prefer service role, fall back to server (anon) */
async function getSupabase() {
  return getServiceSupabase() ?? (await getServerSupabase());
}

function hashText(text: string, targetLang: string): string {
  return createHash("sha256").update(`${text}::${targetLang}`).digest("hex");
}

/**
 * Translate a text string on demand with caching.
 *
 * 1. Check translation_cache for an existing translation.
 * 2. If not found, call Claude Haiku via translateText().
 * 3. Store the result in translation_cache for future requests.
 * 4. Returns the original text if translation fails or locale matches source.
 *
 * Safe to call from Server Components — uses service role Supabase.
 */
export async function translateOnDemand(
  text: string,
  targetLang: string,
  sourceLang = "ro",
): Promise<string> {
  if (!text.trim()) return text;
  if (targetLang === sourceLang) return text;

  const hash = hashText(text, targetLang);
  const supabase = await getSupabase();

  // 1. Check cache
  if (supabase) {
    try {
      const { data } = await supabase
        .from("translation_cache")
        .select("translated_text")
        .eq("source_text_hash", hash)
        .eq("target_lang", targetLang)
        .maybeSingle();

      if (data?.translated_text) return data.translated_text;
    } catch {
      // Cache read failed — continue to translate
    }
  }

  // 2. Translate via Claude Haiku
  const translated = await translateText(text, targetLang, sourceLang);
  if (!translated) return text;

  // 3. Store in cache — runs after the response is sent so Vercel
  //    does not kill the lambda before the write completes.
  //    `defaultToNull: false` sends Prefer: missing=default so PostgREST
  //    uses gen_random_uuid() for the PK instead of null, allowing the
  //    ON CONFLICT on (source_text_hash, target_lang) to work correctly.
  if (supabase) {
    after(async () => {
      const { error } = await supabase
        .from("translation_cache")
        .upsert(
          [
            {
              source_text_hash: hash,
              source_lang: sourceLang,
              target_lang: targetLang,
              translated_text: translated,
            },
          ],
          { onConflict: "source_text_hash,target_lang", defaultToNull: false },
        );
      if (error) console.error("[translateOnDemand] cache write error:", error.message);
    });
  }

  return translated;
}

/**
 * Translate multiple fields at once. Returns an object with the same
 * keys but translated values. Runs translations in parallel.
 */
export async function translateFields<T extends Record<string, string>>(
  fields: T,
  targetLang: string,
  sourceLang = "ro",
): Promise<T> {
  if (targetLang === sourceLang) return fields;

  const keys = Object.keys(fields) as (keyof T)[];
  const values = await Promise.all(
    keys.map((key) => translateOnDemand(fields[key] as string, targetLang, sourceLang)),
  );

  const result = { ...fields };
  keys.forEach((key, i) => {
    (result as Record<string, string>)[key as string] = values[i];
  });
  return result;
}
