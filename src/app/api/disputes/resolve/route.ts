/**
 * POST /api/disputes/resolve — Admin resolves a dispute
 * Consequences:
 *   resolved_requester → negative trust impact on respondent
 *   resolved_responder → negative trust impact on initiator
 *   resolved_split     → no penalty
 *   rejected           → warning to initiator
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Resolution = "resolved_requester" | "resolved_responder" | "resolved_split" | "rejected";

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

  // Verify admin
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin" && profile?.role !== "moderator") {
    return NextResponse.json({ error: "Only admins can resolve disputes" }, { status: 403 });
  }

  let body: { disputeId?: string; resolution?: string; notes?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { disputeId, resolution, notes } = body;
  if (!disputeId || !resolution) {
    return NextResponse.json({ error: "disputeId and resolution are required" }, { status: 400 });
  }

  const validResolutions: Resolution[] = ["resolved_requester", "resolved_responder", "resolved_split", "rejected"];
  if (!validResolutions.includes(resolution as Resolution)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  // Fetch dispute
  const { data: dispute, error: fetchErr } = await db
    .from("disputes")
    .select("*")
    .eq("id", disputeId)
    .maybeSingle();

  if (fetchErr || !dispute) return NextResponse.json({ error: "Dispute not found" }, { status: 404 });

  // Update dispute
  const { data: updated, error: updateErr } = await db
    .from("disputes")
    .update({
      status: resolution,
      resolution_notes: notes ?? "",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", disputeId)
    .select("*")
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Transition the swap to "resolved"
  try {
    await fetch(new URL("/api/swaps/transition", request.url).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ swapId: dispute.swap_id, toStatus: "resolved" }),
    });
  } catch {
    // best effort
  }

  // Apply consequences based on resolution
  const res = resolution as Resolution;
  const penalizedUserId =
    res === "resolved_requester" ? dispute.respondent_id :
    res === "resolved_responder" ? dispute.initiator_id :
    res === "rejected" ? dispute.initiator_id :
    null;

  if (penalizedUserId) {
    // Increment reports_against counter on trust profile
    await db.rpc("increment_reports_against", { target_user_id: penalizedUserId }).then(({ error: rpcErr }) => {
      if (rpcErr) {
        // Fallback: try direct update on profiles
        void db.from("profiles").update({
          updated_at: new Date().toISOString(),
        }).eq("id", penalizedUserId);
      }
    });
  }

  // Notify both parties
  const notifType = res === "rejected" ? "dispute_rejected" : "dispute_resolved";
  const statusLabel =
    res === "resolved_requester" ? "resolved in favor of requester" :
    res === "resolved_responder" ? "resolved in favor of responder" :
    res === "resolved_split" ? "resolved with split decision" :
    "rejected";

  await db.from("notifications").insert([
    {
      user_id: dispute.initiator_id,
      type: notifType,
      title: "Dispute update",
      message: `Your dispute has been ${statusLabel}.`,
      read: false,
      priority: res === "rejected" ? "warning" : "high",
    },
    {
      user_id: dispute.respondent_id,
      type: notifType,
      title: "Dispute update",
      message: `A dispute involving you has been ${statusLabel}.`,
      read: false,
      priority: "high",
    },
  ]).then(({ error: notifErr }) => {
    if (notifErr) console.error("[disputes/resolve] notification error:", notifErr.message);
  });

  // Log audit event
  await db.from("swap_events").insert({
    swap_id: dispute.swap_id,
    actor_id: user.id,
    action: "dispute_resolved",
    from_status: "disputed",
    to_status: "resolved",
    metadata: { resolution, disputeId, notes },
  }).then(({ error: logErr }) => {
    if (logErr) console.error("[disputes/resolve] event log error:", logErr.message);
  });

  return NextResponse.json({ dispute: updated });
}
