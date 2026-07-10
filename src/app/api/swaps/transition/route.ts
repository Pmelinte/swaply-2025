/**
 * POST /api/swaps/transition
 * Server-side swap state machine — validates transitions before applying.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SwapStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "delivered_by_a"
  | "delivered_by_b"
  | "completed"
  | "cancelled"
  | "disputed"
  | "resolved";

const VALID_TRANSITIONS: Record<SwapStatus, SwapStatus[]> = {
  pending: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled", "disputed"],
  in_progress: ["delivered_by_a", "cancelled", "disputed"],
  delivered_by_a: ["delivered_by_b", "disputed"],
  delivered_by_b: ["completed", "disputed"],
  disputed: ["resolved"],
  completed: [],
  cancelled: [],
  resolved: [],
};

export async function POST(request: NextRequest) {
  // --- Auth: extract user from access token ---
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  // Verify the calling user
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse body ---
  let body: { swapId?: string; toStatus?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { swapId, toStatus } = body;
  if (!swapId || !toStatus) {
    return NextResponse.json(
      { error: "swapId and toStatus are required" },
      { status: 400 }
    );
  }

  if (!Object.keys(VALID_TRANSITIONS).includes(toStatus)) {
    return NextResponse.json(
      { error: `Invalid target status: ${toStatus}` },
      { status: 400 }
    );
  }

  // --- Use service role for DB writes (bypass RLS) ---
  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : userClient;

  // --- Fetch swap & validate participant ---
  const { data: swap, error: fetchErr } = await db
    .from("swaps")
    .select("id, status, requester_id, responder_id")
    .eq("id", swapId)
    .maybeSingle();

  if (fetchErr || !swap) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }

  const isParticipant =
    swap.requester_id === user.id || swap.responder_id === user.id;

  // "resolved" is admin-only
  if (toStatus === "resolved") {
    // Check admin role via user metadata or profiles table
    const { data: profile } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin" && profile?.role !== "moderator") {
      return NextResponse.json(
        { error: "Only admins can resolve disputes" },
        { status: 403 }
      );
    }
  } else if (!isParticipant) {
    return NextResponse.json(
      { error: "Not a participant of this swap" },
      { status: 403 }
    );
  }

  // --- Validate transition ---
  const currentStatus = swap.status as SwapStatus;
  const allowed = VALID_TRANSITIONS[currentStatus] ?? [];

  if (!allowed.includes(toStatus as SwapStatus)) {
    return NextResponse.json(
      {
        error: `Invalid transition: ${currentStatus} → ${toStatus}`,
        allowed,
      },
      { status: 422 }
    );
  }

  // --- Apply transition ---
  const { data: updated, error: updateErr } = await db
    .from("swaps")
    .update({
      status: toStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", swapId)
    .select("*")
    .maybeSingle();

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  // --- Lock bundles on acceptance ---
  if (toStatus === "accepted") {
    const now = new Date().toISOString();
    await db
      .from("swap_bundles")
      .update({ locked: true, locked_at: now })
      .eq("swap_id", swapId)
      .eq("locked", false)
      .then(({ error: lockErr }) => {
        if (lockErr) console.error("[swap-transition] bundle lock error:", lockErr.message);
      });

    // Log bundle lock event
    await db
      .from("swap_events")
      .insert({
        swap_id: swapId,
        actor_id: user.id,
        action: "bundle_locked",
        metadata: { reason: "swap_accepted" },
      })
      .then(({ error: logErr }) => {
        if (logErr) console.error("[swap-transition] bundle lock event error:", logErr.message);
      });
  }

  // --- Log audit event ---
  await db
    .from("swap_events")
    .insert({
      swap_id: swapId,
      actor_id: user.id,
      action: "status_transition",
      from_status: currentStatus,
      to_status: toStatus,
      metadata: {},
    })
    .then(({ error: logErr }) => {
      if (logErr) console.error("[swap-transition] event log error:", logErr.message);
    });

  return NextResponse.json({ swap: updated });
}
