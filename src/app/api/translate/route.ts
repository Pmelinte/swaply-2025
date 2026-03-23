import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { translateSchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";
import { getServiceSupabase } from "@/lib/supabase/service";
import { createHash } from "crypto";

// ── NLLB-200 language codes for all 43 supported locales ────────────
const NLLB_CODES: Record<string, string> = {
  en: "eng_Latn", ro: "ron_Latn", fr: "fra_Latn", de: "deu_Latn",
  es: "spa_Latn", it: "ita_Latn", pt: "por_Latn", nl: "nld_Latn",
  pl: "pol_Latn", el: "ell_Grek", hu: "hun_Latn", bg: "bul_Cyrl",
  cs: "ces_Latn", sk: "slk_Latn", hr: "hrv_Latn", sl: "slv_Latn",
  sr: "srp_Cyrl", sv: "swe_Latn", da: "dan_Latn", fi: "fin_Latn",
  no: "nob_Latn", lt: "lit_Latn", lv: "lvs_Latn", et: "est_Latn",
  ga: "gle_Latn", mt: "mlt_Latn", ru: "rus_Cyrl", tr: "tur_Latn",
  ar: "arb_Arab", zh: "zho_Hans", hi: "hin_Deva", bn: "ben_Beng",
  ja: "jpn_Jpan", ko: "kor_Hang", vi: "vie_Latn", th: "tha_Thai",
  id: "ind_Latn", ms: "zsm_Latn", fil: "tgl_Latn", fa: "pes_Arab",
  mn: "khk_Cyrl", uk: "ukr_Cyrl", yi: "ydd_Hebr",
};

// ── Fallback OPUS-MT models for high-quality direct pairs ───────────
const OPUS_MT_PAIRS: Record<string, string> = {
  "ro-en": "Helsinki-NLP/opus-mt-ro-en",
  "en-ro": "Helsinki-NLP/opus-mt-en-ro",
  "es-en": "Helsinki-NLP/opus-mt-es-en",
  "en-es": "Helsinki-NLP/opus-mt-en-es",
  "ro-es": "Helsinki-NLP/opus-mt-ro-es",
  "es-ro": "Helsinki-NLP/opus-mt-es-ro",
  "fr-en": "Helsinki-NLP/opus-mt-fr-en",
  "en-fr": "Helsinki-NLP/opus-mt-en-fr",
  "de-en": "Helsinki-NLP/opus-mt-de-en",
  "en-de": "Helsinki-NLP/opus-mt-en-de",
  "it-en": "Helsinki-NLP/opus-mt-it-en",
  "en-it": "Helsinki-NLP/opus-mt-en-it",
};

const NLLB_MODEL = "facebook/nllb-200-distilled-600M";

function hashText(text: string, targetLang: string): string {
  return createHash("sha256").update(`${text}::${targetLang}`).digest("hex");
}

/** Try to get cached translation from Supabase */
async function getCachedTranslation(
  textHash: string,
  targetLang: string,
): Promise<string | null> {
  const supabase = getServiceSupabase();
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

/** Cache a translation in Supabase */
async function cacheTranslation(
  textHash: string,
  sourceLang: string,
  targetLang: string,
  translatedText: string,
): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) return;
  try {
    await supabase.from("translation_cache").upsert(
      {
        source_text_hash: textHash,
        source_lang: sourceLang,
        target_lang: targetLang,
        translated_text: translatedText,
      },
      { onConflict: "source_text_hash,target_lang" },
    );
  } catch {
    // Cache write is best-effort
  }
}

/** Translate using OPUS-MT model (high quality for supported pairs) */
async function translateWithOpusMT(
  text: string,
  model: string,
  hfKey: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.translation_text ?? null;
  } catch {
    return null;
  }
}

/** Translate using NLLB-200 (supports all 43 languages) */
async function translateWithNLLB(
  text: string,
  srcLang: string,
  tgtLang: string,
  hfKey: string,
): Promise<string | null> {
  const srcCode = NLLB_CODES[srcLang];
  const tgtCode = NLLB_CODES[tgtLang];
  if (!srcCode || !tgtCode) return null;

  try {
    const res = await fetch(
      `https://api-inference.huggingface.co/models/${NLLB_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { src_lang: srcCode, tgt_lang: tgtCode },
        }),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0]?.translation_text ?? null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`translate:${ip}`, {
    limit: 10,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { translated: "", status: "error", message: "Rate limited" },
      { status: 429 },
    );
  }

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

  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (!hfKey) {
    return NextResponse.json({
      translated: text,
      status: "fallback",
      message: "API key missing",
    });
  }

  // ── Try OPUS-MT first (higher quality for direct pairs) ───────────
  const pair = `${from}-${to}`;
  const opusModel = OPUS_MT_PAIRS[pair];
  if (opusModel) {
    const result = await translateWithOpusMT(text, opusModel, hfKey);
    if (result) {
      // Cache in background
      void cacheTranslation(textHash, from, to, result);
      return NextResponse.json({ translated: result, status: "ok" });
    }
  }

  // ── Fall back to NLLB-200 (all 43 languages) ─────────────────────
  const nllbResult = await translateWithNLLB(text, from, to, hfKey);
  if (nllbResult) {
    void cacheTranslation(textHash, from, to, nllbResult);
    return NextResponse.json({ translated: nllbResult, status: "ok" });
  }

  // ── Last resort: pivot through English ────────────────────────────
  if (from !== "en" && to !== "en") {
    const toEnglish = await translateWithNLLB(text, from, "en", hfKey);
    if (toEnglish) {
      const fromEnglish = await translateWithNLLB(toEnglish, "en", to, hfKey);
      if (fromEnglish) {
        void cacheTranslation(textHash, from, to, fromEnglish);
        return NextResponse.json({ translated: fromEnglish, status: "ok" });
      }
    }
  }

  return NextResponse.json({ translated: text, status: "fallback" });
}
