/**
 * POST /api/swaps/transition
 * Server-side swap state machine — validates transitions before applying.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  allowedSwapTransitions,
  isSwapStatus,
  type SwapStatus,
} from "@/lib/swaps/lifecycle";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

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
      { status: 400 },
    );
  }

  if (!isSwapStatus(toStatus)) {
    return NextResponse.json(
      { error: `Invalid target status: ${toStatus}` },
      { status: 400 },
    );
  }

  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : userClient;

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
  if (!isParticipant) {
    return NextResponse.json(
      { error: "Not a participant of this swap" },
      { status: 403 },
    );
  }

  if (!isSwapStatus(swap.status)) {
    return NextResponse.json(
      { error: `Unsupported current status: ${String(swap.status)}` },
      { status: 409 },
    );
  }

  const currentStatus: SwapStatus = swap.status;
  const allowed = allowedSwapTransitions(currentStatus);

  if (!allowed.includes(toStatus)) {
    return NextResponse.json(
      {
        error: `Invalid transition: ${currentStatus} → ${toStatus}`,
        allowed,
      },
      { status: 422 },
    );
  }

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
      { status: 500 },
    );
  }

  if (toStatus === "accepted") {
    const now = new Date().toISOString();
    await db
      .from("swap_bundles")
      .update({ locked: true, locked_at: now })
      .eq("swap_id", swapId)
      .eq("locked", false)
      .then(({ error: lockErr }) => {
        if (lockErr) {
          console.error("[swap-transition] bundle lock error:", lockErr.message);
        }
      });

    await db
      .from("swap_events")
      .insert({
        swap_id: swapId,
        actor_id: user.id,
        action: "bundle_locked",
        metadata: { reason: "swap_accepted" },
      })
      .then(({ error: logErr }) => {
        if (logErr) {
          console.error(
            "[swap-transition] bundle lock event error:",
            logErr.message,
          );
        }
      });
  }

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
      if (logErr) {
        console.error("[swap-transition] event log error:", logErr.message);
      }
    });

  return NextResponse.json({ swap: updated });
}
