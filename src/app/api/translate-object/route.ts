import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { translateObjectSchema, validateBody } from "@/lib/validation";
import { getServiceSupabase } from "@/lib/supabase/service";
import { translateItemFields } from "@/lib/translate";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(`translate-object:${ip}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limited" },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(
    body,
    translateObjectSchema,
  );
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { objectId, targetLocale } = validated!;
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  // 1. Fetch the item
  const { data: item, error: fetchError } = await supabase
    .from("items")
    .select("title, description, translations")
    .eq("id", objectId)
    .maybeSingle();

  if (fetchError || !item) {
    return NextResponse.json(
      { error: "Object not found" },
      { status: 404 },
    );
  }

  // 2. Check if translation already cached in DB
  const existing = item.translations as Record<string, { title: string; description: string }> | null;
  if (existing?.[targetLocale]) {
    return NextResponse.json({
      title: existing[targetLocale].title,
      description: existing[targetLocale].description,
      source: "cache",
    });
  }

  // 3. Translate title + description
  try {
    const translated = await translateItemFields(
      { title: item.title, description: item.description || "" },
      targetLocale,
      "ro",
    );

    // 4. Save to DB (merge with existing translations)
    const updatedTranslations = {
      ...(existing || {}),
      [targetLocale]: translated,
    };

    await supabase
      .from("items")
      .update({ translations: updatedTranslations })
      .eq("id", objectId);

    // 5. Return translation
    return NextResponse.json({
      title: translated.title,
      description: translated.description,
      source: "translated",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
