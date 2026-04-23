/**
 * POST /api/matching/ai
 * Calls an LLM to find the top 2 best matches for a given slot item.
 * Uses Groq (fast) with Gemini as fallback — same pattern as /api/ai/match.
 */

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

interface Suggestion {
  itemId: string;
  score: number;
  reasoning: string;
}

interface AIResponse {
  suggestions: Suggestion[];
}

function buildPrompt(
  myItem: Record<string, unknown>,
  candidates: Record<string, unknown>[],
): string {
  const preview = candidates.slice(0, 50).map((c, i) => {
    return `${i + 1}. ID:${c.id} | "${c.title}" | Cat:${c.category} | Val:${c.estimated_value ?? "?"}EUR | Wants:${c.swap_wants_description ?? c.swap_wants_category_l1 ?? "anything"}`;
  });

  return `You are a barter/swap matching expert for the Swaply platform.

The user is offering:
- Item: ${myItem.title}
- Category: ${myItem.category}
- Condition: ${myItem.condition}
- Estimated value: ${myItem.estimated_value ?? "unknown"} EUR
- Looking for: ${myItem.swap_wants_description ?? myItem.swap_wants_category_l1 ?? "anything"}
- Value tier desired: ${myItem.swap_wants_value_tier ?? "any"}

Available candidates (${preview.length} items):
${preview.join("\n")}

Select EXACTLY 2 candidates that would be the best matches for the user.
Respond ONLY with valid JSON, no additional text:
{
  "suggestions": [
    { "itemId": "<uuid>", "score": <0-100>, "reasoning": "<short explanation in Romanian, max 50 words>" },
    { "itemId": "<uuid>", "score": <0-100>, "reasoning": "<short explanation in Romanian, max 50 words>" }
  ]
}`;
}

async function callGroq(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "You are a swap matching expert. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 600,
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

async function callGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "You are a swap matching expert. Always respond with valid JSON only." }],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 600,
            responseMimeType: "application/json",
          },
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

function parseSuggestions(raw: string | null): Suggestion[] | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed: AIResponse = JSON.parse(cleaned);
    if (!Array.isArray(parsed.suggestions)) return null;
    return parsed.suggestions
      .filter(
        (s) =>
          typeof s.itemId === "string" &&
          typeof s.score === "number" &&
          typeof s.reasoning === "string",
      )
      .slice(0, 2)
      .map((s) => ({
        itemId: s.itemId,
        score: Math.max(0, Math.min(100, Math.round(s.score))),
        reasoning: s.reasoning.slice(0, 200),
      }));
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: { myItemId?: string; userId?: string; excludeIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { myItemId, userId, excludeIds = [] } = body;
  if (!myItemId || !userId) {
    return NextResponse.json({ error: "myItemId and userId required" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  }

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: myItem }, { data: candidates }] = await Promise.all([
    supabase.from("items").select("*").eq("id", myItemId).single(),
    excludeIds.length > 0
      ? supabase
          .from("items")
          .select("id, title, category, condition, estimated_value, swap_wants_description, swap_wants_category_l1, swap_wants_value_tier, perceived_value_tier, owner_id")
          .neq("owner_id", userId)
          .eq("status", "active")
          .eq("is_active", true)
          .not("id", "in", `(${excludeIds.join(",")})`)
          .order("ai_match_score", { ascending: false, nullsFirst: false })
          .limit(50)
      : supabase
          .from("items")
          .select("id, title, category, condition, estimated_value, swap_wants_description, swap_wants_category_l1, swap_wants_value_tier, perceived_value_tier, owner_id")
          .neq("owner_id", userId)
          .eq("status", "active")
          .eq("is_active", true)
          .order("ai_match_score", { ascending: false, nullsFirst: false })
          .limit(50),
  ]);

  if (!myItem || !candidates?.length) {
    return NextResponse.json({ suggestions: [] });
  }

  const prompt = buildPrompt(myItem, candidates as Record<string, unknown>[]);

  let raw = await callGroq(prompt);
  if (!raw) raw = await callGemini(prompt);

  const suggestions = parseSuggestions(raw);
  if (!suggestions || suggestions.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Fetch full item details for the suggested items
  const suggestedIds = suggestions.map((s) => s.itemId);
  const { data: suggestedItems } = await supabase
    .from("items")
    .select("*, profiles!items_owner_id_fkey(user_id, username, display_name, avatar_url, rating, rating_count, trust_level, trust_score, swaps_completed, id_verified, phone_verified, address_lat, address_lon, address_city, address_country, location, last_active_at)")
    .in("id", suggestedIds);

  return NextResponse.json({
    suggestions: suggestions.map((s) => ({
      ...s,
      item: suggestedItems?.find((i: Record<string, unknown>) => i.id === s.itemId) ?? null,
    })),
  });
}
