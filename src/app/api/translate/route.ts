import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { kvRateLimit, getClientIp, tooManyRequests } from "@/lib/kv-rate-limit";
import { translateSchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { createServerAIGateway } from "@/lib/ai/server";
import { proposeTranslation } from "@/lib/ai/translation";

function hashText(text: string, sourceLang: string, targetLang: string): string {
  return createHash("sha256").update(`${sourceLang}::${targetLang}::${text}`).digest("hex");
}

async function getSupabase() {
  return getServiceSupabase() ?? (await getServerSupabase());
}

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

async function cacheTranslation(
  textHash: string,
  sourceLang: string,
  targetLang: string,
  translatedText: string,
): Promise<void> {
  const supabase = await getSupabase();
  if (!supabase) return;
  try {
    await supabase.from("translation_cache").upsert(
      [{
        source_text_hash: textHash,
        source_lang: sourceLang,
        target_lang: targetLang,
        translated_text: translatedText,
      }],
      { onConflict: "source_text_hash,target_lang", defaultToNull: false },
    );
  } catch {
    // Cache write is best-effort and never changes the translation response.
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success } = await kvRateLimit(`translate:${ip}`, { limit: 30, windowSeconds: 60 });
  if (!success) return tooManyRequests();

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(body, translateSchema);
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { text, from, to } = validated!;
  if (from === to) {
    return NextResponse.json({
      original: text,
      translated: text,
      sourceLocale: from,
      targetLocale: to,
      status: "same_language",
      source: "fallback",
      requiresHumanConfirmation: true,
    });
  }

  const textHash = hashText(text, from, to);
  const cached = await getCachedTranslation(textHash, to);
  if (cached) {
    return NextResponse.json({
      original: text,
      translated: cached,
      sourceLocale: from,
      targetLocale: to,
      status: "translated",
      source: "cache",
      requiresHumanConfirmation: true,
    });
  }

  const proposal = await proposeTranslation(createServerAIGateway(), {
    text,
    sourceLocale: from,
    targetLocale: to,
    preserveTone: true,
  });

  if (proposal.status === "translated" && proposal.translatedText !== proposal.originalText) {
    void cacheTranslation(textHash, from, to, proposal.translatedText);
  }

  return NextResponse.json({
    original: proposal.originalText,
    translated: proposal.translatedText,
    sourceLocale: proposal.sourceLocale,
    targetLocale: proposal.targetLocale,
    status: proposal.status,
    source: proposal.source,
    warning: proposal.warning,
    requiresHumanConfirmation: proposal.requiresHumanConfirmation,
  });
}
