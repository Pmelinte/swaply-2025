/**
 * POST /api/disputes — Create a new dispute for a swap
 * GET  /api/disputes?swap_id=xxx — Get disputes for a swap
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClients(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;

  return { userClient, db };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const swapId = request.nextUrl.searchParams.get("swap_id");

  let query = db.from("disputes").select("*, dispute_evidence(*)");
  if (swapId) query = query.eq("swap_id", swapId);
  else query = query.or(`initiator_id.eq.${user.id},respondent_id.eq.${user.id}`);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ disputes: data });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    swapId?: string;
    reason?: string;
    description?: string;
    evidence?: Array<{ evidenceType: string; content: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { swapId, reason, description, evidence } = body;
  if (!swapId || !reason) {
    return NextResponse.json({ error: "swapId and reason are required" }, { status: 400 });
  }

  // Verify user is a participant
  const { data: swap, error: swapErr } = await db
    .from("swaps")
    .select("id, requester_id, responder_id, status")
    .eq("id", swapId)
    .maybeSingle();

  if (swapErr || !swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });

  const isRequester = swap.requester_id === user.id;
  const isResponder = swap.responder_id === user.id;
  if (!isRequester && !isResponder) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const respondentId = isRequester ? swap.responder_id : swap.requester_id;

  // Create the dispute
  const { data: dispute, error: disputeErr } = await db
    .from("disputes")
    .insert({
      swap_id: swapId,
      initiator_id: user.id,
      respondent_id: respondentId,
      reason,
      description: description ?? "",
      status: "open",
    })
    .select("*")
    .single();

  if (disputeErr) return NextResponse.json({ error: disputeErr.message }, { status: 500 });

  // Insert evidence if provided
  if (evidence && evidence.length > 0) {
    const evidenceRows = evidence.map((e) => ({
      dispute_id: dispute.id,
      submitted_by: user.id,
      evidence_type: e.evidenceType,
      content: e.content,
    }));
    await db.from("dispute_evidence").insert(evidenceRows);
  }

  // Transition swap to disputed status
  try {
    await fetch(new URL("/api/swaps/transition", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ swapId, toStatus: "disputed" }),
    });
  } catch {
    // Best effort — dispute is already created
  }

  // Create notification
  await db.from("notifications").insert({
    user_id: respondentId,
    type: "dispute_update",
    title: "Dispute opened",
    message: `A dispute has been opened for swap ${swapId.slice(0, 8)}`,
    read: false,
    priority: "high",
  }).then(({ error: notifErr }) => {
    if (notifErr) console.error("[disputes] notification error:", notifErr.message);
  });

  const { data: fullDispute } = await db
    .from("disputes")
    .select("*, dispute_evidence(*)")
    .eq("id", dispute.id)
    .single();

  return NextResponse.json({ dispute: fullDispute }, { status: 201 });
}
