// src/app/api/ai/classify-image/route.ts

import { NextResponse } from "next/server";
import { classifyItemFromImage } from "@/lib/ai/item-classification";
import { createServerClient } from "@/lib/supabase/server";
import { ITEM_CATEGORIES } from "@/config/item-categories";
import { generateItemTitle } from "@/lib/ai/generate-item-title";
import { generateItemDescription } from "@/lib/ai/generate-item-description";

/**
 * Endpoint: POST /api/ai/classify-image
 *
 * Body JSON:
 * {
 *   "imageUrl": "https://...cloudinary..."
 * }
 *
 * Răspuns tipic:
 * {
 *   "ok": true,
 *   "data": {
 *     "title": "...",
 *     "categoryId": "...",
 *     "subcategoryId": "...",
 *     "condition": "...",
 *     "rawCaption": "..."
 *   }
 * }
 */

export async function POST(req: Request) {
  try {
    // 1) Verificăm userul (autentificarea e mereu obligatorie în Swaply)
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      );
    }

    // 2) Citim body-ul
    const body = await req.json().catch(() => null);
    const imageUrl = body?.imageUrl;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { ok: false, error: "invalid_image_url" },
        { status: 400 }
      );
    }

    // 3) Rulăm clasificarea AI
    const suggestion = await classifyItemFromImage(imageUrl);

    if (!suggestion) {
      return NextResponse.json(
        { ok: false, error: "classification_failed" },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("preferred_language")
      .eq("user_id", user.id)
      .maybeSingle();
    const locale = profile?.preferred_language ?? "ro";

    const localeKey = locale.startsWith("en") ? "en" : "ro";

    const category = ITEM_CATEGORIES.find((c) => c.id === suggestion.categoryId);
    const subcategory = category?.subcategories.find(
      (s) => s.id === suggestion.subcategoryId,
    );

    const title = generateItemTitle({
      primaryLabel: suggestion.rawCaption,
      category: category
        ? { id: category.id, name: category.label?.[localeKey] ?? category.label?.ro } as any
        : null,
      subcategory: subcategory
        ? { id: subcategory.id, name: subcategory.label?.[localeKey] ?? subcategory.label?.ro } as any
        : null,
      locale,
    });

    const description = generateItemDescription({
      title,
      primaryLabel: suggestion.rawCaption,
      category: category
        ? { id: category.id, name: category.label?.[localeKey] ?? category.label?.ro } as any
        : null,
      subcategory: subcategory
        ? { id: subcategory.id, name: subcategory.label?.[localeKey] ?? subcategory.label?.ro } as any
        : null,
      condition: suggestion.condition,
      locale,
    });

    // 4) Returnăm succes
    return NextResponse.json({
      ok: true,
      data: {
        ...suggestion,
        title,
        description,
      },
    });
  } catch (error) {
    console.error("[AI classify-image] Unexpected server error:", error);

    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
