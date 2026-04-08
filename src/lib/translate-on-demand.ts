import "server-only";

import { createHash } from "crypto";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";

/** Get a Supabase client — prefer service role, fall back to server (anon) */
async function getSupabase() {
  const svc = getServiceSupabase();
  if (!svc) {
    console.warn("[translateOnDemand] SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon client");
  }
  return svc ?? (await getServerSupabase());
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
 * 4. Returns the original text if translation fails or locale is ro/en.
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
      const { data, error } = await supabase
        .from("translation_cache")
        .select("translated_text")
        .eq("source_text_hash", hash)
        .eq("target_lang", targetLang)
        .maybeSingle();

      if (error) {
        console.error("[translateOnDemand] cache read error:", error.message);
      } else if (data?.translated_text) {
        return data.translated_text;
      }
    } catch (err) {
      console.error("[translateOnDemand] cache read exception:", err);
    }
  }

  // 2. On-demand translation via API is temporarily disabled.
  //    Return original text when no cached translation exists.
  return text;
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
