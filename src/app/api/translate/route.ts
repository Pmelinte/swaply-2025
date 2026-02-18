import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const LANG_PAIRS: Record<string, string> = {
  "ro-en": "Helsinki-NLP/opus-mt-ro-en",
  "en-ro": "Helsinki-NLP/opus-mt-en-ro",
  "es-en": "Helsinki-NLP/opus-mt-es-en",
  "en-es": "Helsinki-NLP/opus-mt-en-es",
  "ro-es": "Helsinki-NLP/opus-mt-ro-es",
  "es-ro": "Helsinki-NLP/opus-mt-es-ro",
};

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 30, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ translated: "", status: "error", message: "Rate limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const { text, from, to } = body as { text?: string; from?: string; to?: string };

  if (!text || !from || !to) {
    return NextResponse.json({ error: "Parametri lipsa: text, from, to" }, { status: 400 });
  }

  if (from === to) {
    return NextResponse.json({ translated: text, status: "same_language" });
  }

  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const pair = `${from}-${to}`;
  const model = LANG_PAIRS[pair];

  if (!hfKey || !model) {
    return NextResponse.json({
      translated: text,
      status: "fallback",
      message: !hfKey ? "API key lipsa" : `Pereche ${pair} nesuportata`,
    });
  }

  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
    });

    if (!res.ok) {
      return NextResponse.json({ translated: text, status: "fallback" });
    }

    const data = await res.json();
    const translated = data?.[0]?.translation_text ?? text;
    return NextResponse.json({ translated, status: "ok" });
  } catch {
    return NextResponse.json({ translated: text, status: "fallback" });
  }
}
