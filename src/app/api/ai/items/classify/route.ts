// src/app/api/ai/items/classify/route.ts

import { NextResponse } from "next/server";
import type { ItemClassificationResult } from "@/features/items/ai/client";

type HfPrediction =
  | {
      label: string;
      score?: number;
    }
  | {
      // pentru alte modele (ex: image-to-text)
      generated_text?: string;
      score?: number;
    };

type HfResponse = HfPrediction[] | Record<string, unknown>;

/**
 * Endpoint intern pentru clasificarea imaginilor de item.
 *
 * Primește:
 *  - imageUrl: string
 *  - locale?: string ("ro", "en", etc.)
 *
 * Întoarce:
 *  - ItemClassificationResult (titlu sugerat + meta)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl : "";
    const locale =
      typeof body.locale === "string" && body.locale.trim().length > 0
        ? body.locale
        : "en";

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Missing imageUrl in request body" },
        { status: 400 },
      );
    }

    const hfUrl =
      process.env.HF_ITEM_CLASSIFIER_URL ??
      process.env.HF_IMAGE_CLASSIFIER_URL ??
      "";
    const hfToken =
      process.env.HF_API_TOKEN ??
      process.env.HF_ACCESS_TOKEN ??
      process.env.HUGGINGFACE_API_KEY ??
      "";

    if (!hfUrl || !hfToken) {
      // Configurație lipsă – mai bine afișăm eroare clară decât să mințim UI-ul.
      return NextResponse.json(
        {
          error:
            "AI classifier is not configured. Please set HF_ITEM_CLASSIFIER_URL and HF_API_TOKEN in environment.",
        },
        { status: 500 },
      );
    }

    // Hugging Face Inference API – generic POST
    const hfResponse = await fetch(hfUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: imageUrl,
        parameters: {
          // poți folosi locale aici dacă modelul tău suportă asta
          // deocamdată îl trimitem doar ca extra în "options"
          options: {
            use_locale: locale,
          },
        },
      }),
    });

    if (!hfResponse.ok) {
      const text = await hfResponse.text().catch(() => "");
      return NextResponse.json(
        {
          error: `HF API error: ${hfResponse.status} ${hfResponse.statusText}`,
          details: text.slice(0, 500),
        },
        { status: 502 },
      );
    }

    const hfData = (await hfResponse.json()) as HfResponse;

    const result: ItemClassificationResult = normalizeHfResponse(hfData);

    // Completăm câmpuri implicite, ca să nu spargem UI-ul
    if (!result.title || result.title.trim().length === 0) {
      result.title = "Item";
    }
    if (!result.condition) {
      result.condition = "unknown";
    }
    if (typeof result.confidence !== "number") {
      result.confidence = undefined;
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Error in /api/ai/items/classify:", err);
    return NextResponse.json(
      { error: "Unexpected error while classifying image" },
      { status: 500 },
    );
  }
}

/**
 * Normalizează răspunsul Hugging Face (indiferent de model)
 * în ItemClassificationResult.
 */
function normalizeHfResponse(hfData: HfResponse): ItemClassificationResult {
  // Caz 1: array clasic de { label, score }
  if (Array.isArray(hfData) && hfData.length > 0) {
    const first = hfData[0] as HfPrediction;

    // Model de tip image-classification → { label, score }
    if ("label" in first && typeof first.label === "string") {
      return {
        title: humanizeLabel(first.label),
        category: first.label,
        subcategory: undefined,
        condition: "unknown",
        confidence:
          typeof first.score === "number" ? first.score : undefined,
        raw: hfData,
      };
    }

    // Model de tip image-to-text → { generated_text }
    if ("generated_text" in first && first.generated_text) {
      return {
        title: String(first.generated_text),
        category: undefined,
        subcategory: undefined,
        condition: "unknown",
        confidence:
          typeof first.score === "number" ? first.score : undefined,
        raw: hfData,
      };
    }
  }

  // Caz fallback – nu recunoaștem structura, dar expunem raw
  return {
    title: "Item",
    category: undefined,
    subcategory: undefined,
    condition: "unknown",
    confidence: undefined,
    raw: hfData,
  };
}

/**
 * Transformă label-ul de la model într-un titlu mai uman:
 * "laptop_computer" → "Laptop computer"
 */
function humanizeLabel(label: string): string {
  if (!label) return "Item";
  const cleaned = label.replace(/_/g, " ").trim();
  if (!cleaned) return "Item";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
