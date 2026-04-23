import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  fetchCandidateItems,
  fetchItemById,
  type MatchingItemRow,
} from "@/lib/matching/matchQueries";

type RequestBody = {
  myItemId?: string;
  userId?: string;
  excludeIds?: string[];
};

type RawSuggestion = { itemId?: string; score?: number; reasoning?: string };

const ANTHROPIC_MODEL = "claude-haiku-4-5";

function buildPrompt(myItem: MatchingItemRow, candidates: MatchingItemRow[]) {
  const lines = candidates.slice(0, 50).map((c, i) => {
    const cat = c.category ?? "?";
    const val = c.estimated_value ?? "?";
    const seeks = c.swap_wants_category_l1 ?? "any";
    return `${i + 1}. ID:${c.id} | "${c.title}" | Cat:${cat} | Val:${val}EUR | Wants:${seeks}`;
  });

  return `You are a barter/swap matching expert for the Swaply platform.

The user offers:
- Title: ${myItem.title}
- Category: ${myItem.category ?? "unknown"}
- Value tier: ${myItem.perceived_value_tier ?? "unknown"}
- Looking for: ${myItem.swap_wants_category_l1 ?? "anything"}

Candidates (${lines.length}):
${lines.join("\n")}

Select EXACTLY 2 candidate IDs that are the best matches.
Respond with valid JSON ONLY, no preamble:
{
  "suggestions": [
    { "itemId": "<uuid>", "score": <0-100>, "reasoning": "<Romanian, max 40 words>" },
    { "itemId": "<uuid>", "score": <0-100>, "reasoning": "<Romanian, max 40 words>" }
  ]
}`;
}

async function callAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        temperature: 0.3,
        system:
          "You are a swap matching expert. Always respond with valid JSON only, no extra text.",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? null;
    return text;
  } catch {
    return null;
  }
}

function parseJsonish(raw: string): RawSuggestion[] | null {
  if (!raw) return null;
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/, "");
  try {
    const parsed = JSON.parse(clean) as { suggestions?: RawSuggestion[] };
    if (!parsed?.suggestions) return null;
    return parsed.suggestions;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const { myItemId, userId, excludeIds = [] } = body;
  if (!myItemId || !userId) {
    return NextResponse.json({ error: "missing parameters" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase unavailable" }, { status: 500 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const myItem = await fetchItemById(supabase, myItemId);
  if (!myItem) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }

  const allCandidates = await fetchCandidateItems(supabase, userId, 100);
  const excludeSet = new Set(excludeIds);
  const candidates = allCandidates.filter((c) => !excludeSet.has(c.id)).slice(0, 50);

  if (candidates.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const prompt = buildPrompt(myItem, candidates);
    const raw = await callAnthropic(prompt);
    const parsed = raw ? parseJsonish(raw) : null;

    if (!parsed || parsed.length === 0) {
      return NextResponse.json({ error: "AI unavailable" }, { status: 502 });
    }

    const candidateById = new Map(candidates.map((c) => [c.id, c] as const));
    const suggestions = parsed
      .map((s) => {
        const id = s.itemId;
        if (!id) return null;
        const item = candidateById.get(id);
        if (!item) return null;
        const score = Math.max(0, Math.min(100, Math.round(s.score ?? 0)));
        const reasoning = (s.reasoning ?? "").slice(0, 400);
        return { item, score, reasoning };
      })
      .filter((s): s is { item: MatchingItemRow; score: number; reasoning: string } => s !== null)
      .slice(0, 2);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
