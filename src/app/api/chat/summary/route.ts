/**
 * POST /api/chat/summary
 *
 * Generates a structured swap summary using Claude Haiku based on the
 * agreed items from the conversation agenda.
 *
 * Kill switch: if env var TRANSLATION_KILL_SWITCH is "1"/"true", returns
 * { disabled: true } without calling the Anthropic API. Clients must render
 * the localized "temporarily disabled" message and skip generation.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AgreedPoint {
  key: string;
  label: string;
}

interface RequestBody {
  itemATitle?: string;
  itemBTitle?: string;
  agreedPoints?: AgreedPoint[];
  userALabel?: string;
  userBLabel?: string;
}

interface SummaryPayload {
  title: string;
  items_exchanged: string;
  exchange_mode: string;
  location: string;
  support_services: string;
  agreed_date: string;
}

function killSwitchActive(): boolean {
  const raw = process.env.TRANSLATION_KILL_SWITCH ?? "";
  return raw === "1" || raw.toLowerCase() === "true";
}

export async function POST(req: Request) {
  if (killSwitchActive()) {
    return NextResponse.json({ disabled: true }, { status: 200 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "api_not_configured" }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const itemATitle = (body.itemATitle ?? "").trim() || "Item A";
  const itemBTitle = (body.itemBTitle ?? "").trim() || "Item B";
  const userALabel = (body.userALabel ?? "User A").trim() || "User A";
  const userBLabel = (body.userBLabel ?? "User B").trim() || "User B";
  const agreedPoints = Array.isArray(body.agreedPoints) ? body.agreedPoints : [];

  const bulletList = agreedPoints.length
    ? agreedPoints.map((p) => `- ${p.label} (${p.key})`).join("\n")
    : "- none";

  const prompt = [
    "Generate a concise summary of the swap agreement based on the agreed points.",
    "",
    `Items being exchanged: "${itemATitle}" (from ${userALabel}) ↔ "${itemBTitle}" (from ${userBLabel}).`,
    "",
    "Agreed points:",
    bulletList,
    "",
    "Return JSON ONLY with the exact fields: title, items_exchanged, exchange_mode, location, support_services, agreed_date.",
    'Use empty string "" for any field not covered by the agreed points. Do not include any text outside the JSON object.',
  ].join("\n");

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system:
          "You are a concise JSON generator for Swaply swap agreements. " +
          "Always respond with a single valid JSON object matching the requested schema. " +
          "Never include explanations, markdown fences, or prose.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "upstream_error", status: res.status }, { status: 502 });
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text: string }>;
    };
    const text = data.content?.[0]?.text?.trim() ?? "";

    // Extract JSON object (tolerate accidental wrapping)
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "invalid_response" }, { status: 502 });
    }

    let parsed: Partial<SummaryPayload>;
    try {
      parsed = JSON.parse(match[0]) as Partial<SummaryPayload>;
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 502 });
    }

    const summary: SummaryPayload = {
      title: parsed.title ?? `${itemATitle} ↔ ${itemBTitle}`,
      items_exchanged: parsed.items_exchanged ?? "",
      exchange_mode: parsed.exchange_mode ?? "",
      location: parsed.location ?? "",
      support_services: parsed.support_services ?? "",
      agreed_date: parsed.agreed_date ?? "",
    };

    return NextResponse.json({ disabled: false, summary });
  } catch {
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
