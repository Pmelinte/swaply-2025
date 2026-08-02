import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { isMatchingPairCompatible } from "@/lib/matching/domainCompatibility";
import { calculateMatchScore } from "@/lib/matching/matchScore";
import {
  fetchCandidateItems,
  fetchItemById,
  fetchProfileById,
  fetchProfilesByIds,
  type MatchingItemRow,
} from "@/lib/matching/matchQueries";

type RequestBody = {
  myItemId?: string;
  excludeIds?: string[];
};

type RawSuggestion = {
  itemId?: string;
  reasoning?: string;
};

type CanonicalSuggestion = {
  item: MatchingItemRow;
  score: number;
  reasoning: string;
  source: "ai" | "deterministic_fallback";
};

const ANTHROPIC_MODEL = "claude-haiku-4-5";

function buildPrompt(
  myItem: MatchingItemRow,
  candidates: Array<{ item: MatchingItemRow; score: number }>,
) {
  const lines = candidates.slice(0, 50).map(({ item, score }, index) => {
    const profile = item.domain_profile ?? { domain: item.item_type ?? "object" };
    const availability =
      item.item_type === "property"
        ? `${String(profile.available_from ?? "flexible")}..${String(profile.available_until ?? "flexible")}`
        : item.item_type === "service"
          ? `${String(profile.delivery_mode ?? "flexible")}; ${String(profile.available_date_from ?? "flexible")}..${String(profile.available_date_until ?? "flexible")}`
          : item.item_type === "event"
            ? `${String(profile.start_date ?? "unknown")}; transferable=${String(profile.is_transferable ?? "n/a")}`
            : "active";

    return `${index + 1}. ID:${item.id} | Domain:${item.item_type} | Title:${JSON.stringify(item.title)} | Category:${item.category ?? "unknown"} | Value:${item.perceived_value_tier ?? "unknown"} | Availability:${availability} | DeterministicScore:${score}`;
  });

  return `You are a supporting assistant for Swaply. The platform has already filtered these candidates through canonical mutual domain compatibility and availability rules. You may rank them, but you must not create, accept or finalize a match.

The user offers:
- Domain: ${myItem.item_type}
- Title: ${myItem.title}
- Category: ${myItem.category ?? "unknown"}
- Value tier: ${myItem.perceived_value_tier ?? "unknown"}
- Accepted domains: ${(myItem.swap_open_to ?? []).join(", ") || "any"}
- Wanted domains: ${(myItem.swap_wants_type ?? []).join(", ") || "any"}

Compatible candidates (${lines.length}):
${lines.join("\n")}

Select at most 2 candidate IDs. Do not invent IDs and do not alter the deterministic score. Respond with valid JSON only:
{
  "suggestions": [
    { "itemId": "<uuid>", "reasoning": "<max 40 words>" }
  ]
}`;
}

async function callAnthropic(prompt: string): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        temperature: 0.2,
        system:
          "Rank only the supplied canonical candidates. Return valid JSON only and never invent identifiers.",
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    return data.content?.find((entry) => entry.type === "text")?.text ?? null;
  } catch {
    return null;
  }
}

function parseJsonish(raw: string): RawSuggestion[] | null {
  if (!raw) return null;
  const clean = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "");

  try {
    const parsed = JSON.parse(clean) as { suggestions?: RawSuggestion[] };
    return Array.isArray(parsed.suggestions) ? parsed.suggestions : null;
  } catch {
    return null;
  }
}

function fallbackReason(item: MatchingItemRow): string {
  if (item.item_type === "property") {
    return "Compatible exchange domain and property availability.";
  }
  if (item.item_type === "service") {
    return "Compatible exchange domain and service delivery profile.";
  }
  if (item.item_type === "event") {
    return "Compatible exchange domain, date and transfer rules.";
  }
  return "Compatible exchange domain, value and public listing data.";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const myItemId = body?.myItemId?.trim();
  const excludeIds = Array.isArray(body?.excludeIds) ? body.excludeIds : [];
  if (!myItemId) {
    return NextResponse.json({ error: "missing parameters" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase unavailable" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const myItem = await fetchItemById(supabase, myItemId);
  if (!myItem || myItem.owner_id !== user.id) {
    return NextResponse.json({ error: "item not found" }, { status: 404 });
  }

  const excluded = new Set(excludeIds);
  const allCandidates = await fetchCandidateItems(supabase, user.id, 100);
  const candidates = allCandidates.filter(
    (candidate) =>
      !excluded.has(candidate.id) &&
      isMatchingPairCompatible(myItem, candidate),
  );

  if (candidates.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const [myProfile, candidateProfiles] = await Promise.all([
    fetchProfileById(supabase, user.id),
    fetchProfilesByIds(
      supabase,
      Array.from(new Set(candidates.map((candidate) => candidate.owner_id))),
    ),
  ]);

  const scored = candidates
    .map((item) => ({
      item,
      score: calculateMatchScore(
        myItem,
        item,
        myProfile,
        candidateProfiles.get(item.owner_id) ?? null,
      ).total,
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 50);

  const byId = new Map(scored.map((entry) => [entry.item.id, entry] as const));
  const raw = await callAnthropic(buildPrompt(myItem, scored));
  const parsed = raw ? parseJsonish(raw) : null;

  let suggestions: CanonicalSuggestion[] = [];
  if (parsed) {
    const used = new Set<string>();
    suggestions = parsed
      .flatMap((entry) => {
        const id = entry.itemId?.trim();
        if (!id || used.has(id)) return [];
        const canonical = byId.get(id);
        if (!canonical) return [];
        used.add(id);
        return [
          {
            item: canonical.item,
            score: canonical.score,
            reasoning:
              entry.reasoning?.trim().slice(0, 400) ||
              fallbackReason(canonical.item),
            source: "ai" as const,
          },
        ];
      })
      .slice(0, 2);
  }

  if (suggestions.length === 0) {
    suggestions = scored.slice(0, 2).map(({ item, score }) => ({
      item,
      score,
      reasoning: fallbackReason(item),
      source: "deterministic_fallback" as const,
    }));
  }

  return NextResponse.json({ suggestions });
}
