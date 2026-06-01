/**
 * POST /api/disputes/evidence — Add evidence to an existing dispute
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;

  let body: { disputeId?: string; evidenceType?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { disputeId, evidenceType, content } = body;
  if (!disputeId || !evidenceType || !content) {
    return NextResponse.json({ error: "disputeId, evidenceType, and content are required" }, { status: 400 });
  }

  // Verify user is a participant
  const { data: dispute } = await db
    .from("disputes")
    .select("id, initiator_id, respondent_id, status")
    .eq("id", disputeId)
    .maybeSingle();

  if (!dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  if (dispute.initiator_id !== user.id && dispute.respondent_id !== user.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }
  if (dispute.status !== "open" && dispute.status !== "waiting_evidence") {
    return NextResponse.json({ error: "Dispute no longer accepts evidence" }, { status: 422 });
  }

  const { data: evidence, error: insertErr } = await db
    .from("dispute_evidence")
    .insert({
      dispute_id: disputeId,
      submitted_by: user.id,
      evidence_type: evidenceType,
      content,
    })
    .select("*")
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  return NextResponse.json({ evidence }, { status: 201 });
}
