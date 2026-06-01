/**
 * POST /api/chat/moderate
 *
 * Server-side sanity check for chat message text. Re-runs the same pattern
 * matching used client-side, so the server can reject blocked content even if
 * the browser check was bypassed. Returns:
 *   { allowed: true }
 *   { allowed: true, warning: "external_contact" }
 *   { allowed: false, reason: "…" }
 */

import { NextResponse } from "next/server";
import { moderateMessageText } from "@/lib/chat/chatModeration";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface RequestBody {
  text?: unknown;
}

const MAX_LENGTH = 4000;

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ allowed: false, reason: "unauthorized" }, { status: 401 });
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ allowed: false, reason: "unauthorized" }, { status: 401 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ allowed: false, reason: "invalid_body" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text : "";

  if (!text.trim()) {
    return NextResponse.json({ allowed: false, reason: "empty" }, { status: 400 });
  }

  if (text.length > MAX_LENGTH) {
    return NextResponse.json({ allowed: false, reason: "too_long" }, { status: 400 });
  }

  const result = moderateMessageText(text);

  if (result.warning === "contactInfoWarning") {
    return NextResponse.json({ allowed: true, warning: "external_contact" });
  }

  return NextResponse.json({ allowed: result.allowed });
}
