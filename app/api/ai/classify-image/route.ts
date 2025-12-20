// src/app/api/ai/classify-image/route.ts

import { NextResponse } from "next/server";
import { classifyItemFromImage } from "@/lib/ai/item-classification";
import { createServerClient } from "@/lib/supabase/server";

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

    // 4) Returnăm succes
    return NextResponse.json({
      ok: true,
      data: suggestion,
    });
  } catch (error) {
    console.error("[AI classify-image] Unexpected server error:", error);

    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
