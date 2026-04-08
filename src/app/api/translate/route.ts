import { NextResponse } from "next/server";
import { kvRateLimit, getClientIp, tooManyRequests } from "@/lib/kv-rate-limit";
import { translateSchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { createHash } from "crypto";

function hashText(text: string, targetLang: string): string {
  return createHash("sha256").update(`${text}::${targetLang}`).digest("hex");
}

/** Get a Supabase client — prefer service role, fall back to server (anon) */
async function getSupabase() {
  return getServiceSupabase() ?? (await getServerSupabase());
}

/** Try to get cached translation from Supabase */
async function getCachedTranslation(
  textHash: string,
  targetLang: string,
): Promise<string | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from("translation_cache")
      .select("translated_text")
      .eq("source_text_hash", textHash)
      .eq("target_lang", targetLang)
      .maybeSingle();
    return data?.translated_text ?? null;
  } catch {
    return null;
  }
}


export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = await kvRateLimit(`translate:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!success) return tooManyRequests();

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(
    body,
    translateSchema,
  );
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json({ error: validationError }, { status: 400 });
  }
  const { text, from, to } = validated!;

  if (from === to) {
    return NextResponse.json({ translated: text, status: "same_language" });
  }

  // ── Check cache first ─────────────────────────────────────────────
  const textHash = hashText(text, to);
  const cached = await getCachedTranslation(textHash, to);
  if (cached) {
    return NextResponse.json({
      translated: cached,
      status: "ok",
      source: "cache",
    });
  }

  // ── On-demand translation via API is temporarily disabled. ────────
  //    Return original text when no cached translation exists.
  return NextResponse.json({ translated: text, status: "fallback" });
}
