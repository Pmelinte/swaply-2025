import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { translateItemContent } from "@/lib/translate";
import { locales } from "@/i18n/config";
import { kvRateLimit, getClientIp, tooManyRequests } from "@/lib/kv-rate-limit";

const VALID_LOCALES = new Set<string>(locales);

function detectSourceLanguage(text: string): string {
  if (/[ăâîșț]/i.test(text)) return "ro";
  if (/[äöüß]/i.test(text)) return "de";
  if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return "fr";
  if (/[ñáéíóúü¿¡]/i.test(text)) return "es";
  if (/[àèéìíîòóùú]/i.test(text)) return "it";
  if (/[ãõçáéíóú]/i.test(text)) return "pt";
  if (/[\u0400-\u04FF]/i.test(text)) return "ru";
  if (/[\u4e00-\u9fff]/i.test(text)) return "zh";
  if (/[\u3040-\u309F\u30A0-\u30FF]/i.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/i.test(text)) return "ko";
  if (/[\u0600-\u06FF]/i.test(text)) return "ar";
  return "en";
}

/**
 * POST /api/translate/item
 * Translate an item's title and description to a target locale.
 * Uses DB-cached translations when available, otherwise translates via Claude Haiku.
 *
 * Body: { itemId: string, targetLocale: string }
 * Response: { title: string, description: string, source: "cache" | "translated" }
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await kvRateLimit(`translate-item:${ip}`, { limit: 5, windowSeconds: 60 });
  if (!success) return tooManyRequests();

  const body = await request.json().catch(() => ({}));
  const { itemId, targetLocale, force } = body as { itemId?: string; targetLocale?: string; force?: boolean };

  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
  }
  if (!targetLocale || !VALID_LOCALES.has(targetLocale)) {
    return NextResponse.json({ error: "Invalid targetLocale" }, { status: 400 });
  }

  // Romanian content doesn't need translation
  if (targetLocale === "ro") {
    return NextResponse.json({ error: "Source language is Romanian" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  // 1. Fetch item with current translations
  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("title, description, translations")
    .eq("id", itemId)
    .maybeSingle();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // 2. Check if translation is already cached (skip if force retranslate)
  const translations = (item.translations as Record<string, { title: string; description: string }>) ?? {};
  if (!force && translations[targetLocale]?.title) {
    return NextResponse.json({
      title: translations[targetLocale].title,
      description: translations[targetLocale].description ?? "",
      source: "cache",
    });
  }

  // 3. Translate via Claude Haiku
  const result = await translateItemContent(
    item.title,
    item.description ?? "",
    targetLocale,
    detectSourceLanguage(`${item.title ?? ""} ${item.description ?? ""}`),
  );

  if (!result.title) {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }

  // 4. Save to DB cache (fire-and-forget, don't block response)
  const updatedTranslations = {
    ...translations,
    [targetLocale]: {
      title: result.title,
      description: result.description ?? "",
    },
  };

  void supabase
    .from("items")
    .update({ translations: updatedTranslations })
    .eq("id", itemId)
    .then(({ error }) => {
      if (error) console.error("[translate-item] Cache write failed:", error.message);
    });

  return NextResponse.json({
    title: result.title,
    description: result.description ?? "",
    source: "translated",
  });
}
