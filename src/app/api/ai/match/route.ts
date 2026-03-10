import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { aiMatchSchema, validateBody } from "@/lib/validation";
import { requestLogger, captureError } from "@/lib/logger";

/**
 * AI Match Analysis — Semantic compatibility evaluation using LLM.
 * Combines with the existing hardcoded score to produce a hybrid score.
 *
 * POST /api/ai/match
 * Body: { offeredItem, requestedItem, baseScore, reasons }
 * Returns: { aiScore, aiSummary, aiConfidence }
 */

interface MatchRequest {
  offeredItem: {
    title: string;
    category: string;
    condition: string;
    description?: string;
    wishlist?: string;
    tags?: string[];
    location?: string;
    perceivedValue?: string;
  };
  requestedItem: {
    title: string;
    category: string;
    condition: string;
    description?: string;
    wishlist?: string;
    tags?: string[];
    location?: string;
    perceivedValue?: string;
  };
  baseScore: number;
  reasons: string[];
}

const SYSTEM_PROMPT = `You are a swap/barter matching AI. Analyze two items and evaluate how good a trade would be.
Consider: category compatibility, perceived value fairness, description relevance, wishlist alignment, condition match, location proximity.
Be concise and specific. Answer in the language of the item descriptions (Romanian if items are in Romanian).`;

function buildUserPrompt(req: MatchRequest): string {
  const { offeredItem: o, requestedItem: r, baseScore, reasons } = req;
  return `Evaluate this swap:

OFFERED (my item): "${o.title}"
- Category: ${o.category}, Condition: ${o.condition}
- Description: ${o.description ?? "N/A"}
- Wishlist: ${o.wishlist ?? "N/A"}
- Tags: ${o.tags?.join(", ") ?? "N/A"}
- Location: ${o.location ?? "N/A"}
- Perceived value: ${o.perceivedValue ?? "medium"}

REQUESTED (their item): "${r.title}"
- Category: ${r.category}, Condition: ${r.condition}
- Description: ${r.description ?? "N/A"}
- Wishlist: ${r.wishlist ?? "N/A"}
- Tags: ${r.tags?.join(", ") ?? "N/A"}
- Location: ${r.location ?? "N/A"}
- Perceived value: ${r.perceivedValue ?? "medium"}

Base algorithmic score: ${baseScore}/100
Algorithmic reasons: ${reasons.join("; ")}

Respond ONLY with valid JSON:
{
  "aiScoreBoost": <number -10 to +20, how much the AI adjusts the base score>,
  "aiSummary": "<1-2 sentence explanation of why this is/isn't a good swap>",
  "aiConfidence": "<high|medium|low>"
}`;
}

async function callGroq(prompt: string, systemPrompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callGemini(prompt: string, systemPrompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 300, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

function parseAiResponse(raw: string | null): { aiScoreBoost: number; aiSummary: string; aiConfidence: "high" | "medium" | "low" } | null {
  if (!raw) return null;
  try {
    const json = JSON.parse(raw);
    const boost = typeof json.aiScoreBoost === "number" ? Math.max(-10, Math.min(20, json.aiScoreBoost)) : 0;
    const summary = typeof json.aiSummary === "string" ? json.aiSummary.slice(0, 300) : "";
    const confidence = ["high", "medium", "low"].includes(json.aiConfidence) ? json.aiConfidence : "medium";
    return { aiScoreBoost: boost, aiSummary: summary, aiConfidence: confidence };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 20, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const log = requestLogger(request);
  try {
    const body = await request.json();
    const { data: validated, error: validationError } = validateBody(body, aiMatchSchema);
    if (validationError) {
      log.warn("Validation failed", { error: validationError });
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const prompt = buildUserPrompt(validated!);

    // Try Groq first (fast, 8s timeout), fall back to Gemini (10s timeout)
    let raw = await callGroq(prompt, SYSTEM_PROMPT);
    let provider = "groq";
    if (!raw) {
      raw = await callGemini(prompt, SYSTEM_PROMPT);
      provider = raw ? "gemini" : "fallback";
    }

    const parsed = parseAiResponse(raw);
    if (!parsed) {
      return NextResponse.json({
        aiScoreBoost: 0,
        aiSummary: "AI analysis unavailable — using algorithmic score only.",
        aiConfidence: "low" as const,
        provider: "fallback",
      });
    }

    return NextResponse.json({ ...parsed, provider });
  } catch (err) {
    captureError(err, { route: "/api/ai/match" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
