import { NextResponse } from "next/server";

/** Diagnostic endpoint: GET /api/ai/test
 *  Tests all AI provider keys. Remove after debugging. */
export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Test Groq
  const groqKey = (process.env.GROQ_API_KEY || "").trim();
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
          max_tokens: 10,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        results.groq = { status: `ERROR HTTP ${res.status}`, keyPrefix: groqKey.slice(0, 8) + "...", error: errBody.slice(0, 300) };
      } else {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        results.groq = { status: "OK", keyPrefix: groqKey.slice(0, 8) + "...", response: text };
      }
    } catch (err) {
      results.groq = { status: "NETWORK ERROR", error: String(err).slice(0, 200) };
    }
  } else {
    results.groq = { status: "NO KEY — GROQ_API_KEY not set" };
  }

  // 2. Test Gemini
  const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (geminiKey) {
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
        results.gemini = { status: `ERROR HTTP ${res.status}`, keyPrefix: geminiKey.slice(0, 4) + "...", error: errBody.slice(0, 300) };
      } else {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        results.gemini = { status: "OK", keyPrefix: geminiKey.slice(0, 4) + "...", response: text };
      }
    } catch (err) {
      results.gemini = { status: "NETWORK ERROR", error: String(err).slice(0, 200) };
    }
  } else {
    results.gemini = { status: "NO KEY — GEMINI_API_KEY not set" };
  }

  // 3. HuggingFace
  const hfKey = (process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN || "").trim();
  const hfEnabled = process.env.NEXT_PUBLIC_HF_ENABLED === "true";
  results.huggingface = {
    hasKey: !!hfKey,
    enabled: hfEnabled,
    status: !hfKey ? "NO KEY" : !hfEnabled ? "DISABLED (NEXT_PUBLIC_HF_ENABLED != true)" : "CONFIGURED",
  };

  return NextResponse.json(results);
}
