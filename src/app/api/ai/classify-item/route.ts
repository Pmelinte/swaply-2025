// src/app/api/ai/classify-item/route.ts

import { NextResponse } from "next/server";
import { classifyImageByUrl } from "@/features/items/server/hf-image-classifier";

type ApiResponse =
  | {
      ok: true;
      meta: {
        model: "huggingface";
        primaryLabel: string;
        confidence: number | null;
        suggestedTitle: string;
        suggestedTags: string[];
        // câmpuri “ready” pentru restul proiectului
        suggestedCategory?: string;
        suggestedSubcategory?: string;
        raw?: unknown;
      };
    }
  | { ok: false; error: string };

export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl : "";

  const result = await classifyImageByUrl(imageUrl);

  if (!result.ok) {
    // IMPORTANT: nu rupem flow-ul — doar comunicăm clar
    const status = result.error === "hf_token_missing" ? 501 : 502;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  // Deocamdată category/subcategory le obții din mapper-ul tău existent în UI
  // (ai deja mapAiLabelsToCategory). Aici întoarcem meta brut + tags.
  return NextResponse.json(
    {
      ok: true,
      meta: {
        model: "huggingface",
        primaryLabel: result.primaryLabel,
        confidence: result.confidence,
        suggestedTitle: result.suggestedTitle,
        suggestedTags: result.suggestedTags,
        raw: result.raw,
      },
    },
    { status: 200 }
  );
}
