import "server-only";
import { createHash } from "crypto";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { translateText } from "@/lib/translate";

/** Get a Supabase client — prefer service role, fall back to server (anon) */
async function getSupabase() {
  return getServiceSupabase() ?? (await getServerSupabase());
}

/** Get a fresh Supabase service role client — safe to use inside after() */
function getAfterSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function hashText(text: string, targetLang: string): string {
  return createHash("sha256").update(`${text}::${targetLang}`).digest("hex");
}

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

  // 3. Store in cache after response — uses a fresh client without
  //    request context so fetch works correctly inside after()
  after(async () => {
    const client = getAfterSupabase();
    if (!client) return;
    const { error } = await client
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

  return translated;
}

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
