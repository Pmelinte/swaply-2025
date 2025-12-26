import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const prompt = body.prompt ?? "";
  const hfKey = process.env.HUGGINGFACE_API_KEY;

  if (!hfKey) {
    return NextResponse.json(
      {
        status: "fallback",
        suggestions: [
          "Analiza AI dezactivată în mediu demo",
          `Sugestie manuală pentru: ${prompt}`,
        ],
      },
      { status: 200 },
    );
  }

  const response = await fetch("https://api-inference.huggingface.co/models/distilbert-base-uncased", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfKey}`,
    },
    body: JSON.stringify({ inputs: prompt || "swaply suggestion" }),
  }).catch(() => null);

  if (!response || !response.ok) {
    return NextResponse.json(
      {
        status: "error",
        message: "AI indisponibil, activăm modul manual",
      },
      { status: 200 },
    );
  }

  const data = await response.json();
  return NextResponse.json({ status: "ok", raw: data });
}
