import { NextResponse } from "next/server";

/** Simple diagnostic endpoint: GET /api/ai/test
 *  Tests Gemini API key by sending a text-only request (no image needed).
 *  Remove this endpoint after debugging. */
export async function GET() {
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();

  if (!geminiKey) {
    return NextResponse.json({
      gemini: "NO KEY — GEMINI_API_KEY not set in environment",
      keyLength: 0,
    });
  }

  // Test with a simple text prompt (no image — uses minimal quota)
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
        }),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json({
        gemini: `ERROR HTTP ${res.status}`,
        keyLength: geminiKey.length,
        keyPrefix: geminiKey.slice(0, 4) + "...",
        error: errBody.slice(0, 500),
      });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return NextResponse.json({
      gemini: "OK",
      keyLength: geminiKey.length,
      keyPrefix: geminiKey.slice(0, 4) + "...",
      response: text,
    });
  } catch (err) {
    return NextResponse.json({
      gemini: "NETWORK ERROR",
      keyLength: geminiKey.length,
      error: String(err).slice(0, 200),
    });
  }
}
