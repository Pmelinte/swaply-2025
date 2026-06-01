/**
 * POST /api/payments/escrow
 *
 * Escrow guarantee system for courier-based swaps via Stripe.
 * Uses PaymentIntents with capture_method: 'manual' so the funds are
 * authorized (held) but not captured — they get cancelled (returned)
 * on successful delivery confirmation.
 *
 * Actions:
 *   { action: "create",  swapId, userId }          → authorize 15 RON hold
 *   { action: "release", swapId }                   → release both guarantees after bilateral confirm
 *   { action: "dispute", swapId, userId, reason? }  → mark escrow as disputed
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/payments/stripe";

const ESCROW_AMOUNT_BANI = 1500; // 15.00 RON in bani (cents)
const ESCROW_AMOUNT_RON = 15.0;

export async function POST(request: NextRequest) {
  // --- Auth ---
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // --- Parse body ---
  let body: { action?: string; swapId?: string; userId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, swapId } = body;
  if (!action || !swapId) {
    return NextResponse.json({ error: "action and swapId are required" }, { status: 400 });
  }

  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;

  // Verify user is participant
  const { data: swap, error: swapErr } = await db
    .from("swaps")
    .select("id, status, requester_id, responder_id")
    .eq("id", swapId)
    .maybeSingle();

  if (swapErr || !swap) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }

  const isParticipant = swap.requester_id === user.id || swap.responder_id === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // --- Actions ---
  switch (action) {
    case "create": {
      return handleCreate(db, swap, user.id);
    }
    case "release": {
      return handleRelease(db, swap);
    }
    case "dispute": {
      return handleDispute(db, swap, user.id, body.reason);
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

// --- Create: authorize a Stripe PaymentIntent (manual capture = hold) ---
async function handleCreate(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  swap: { id: string; requester_id: string; responder_id: string },
  userId: string,
) {
  // Check if user already has an escrow for this swap
  const { data: existing } = await db
    .from("swap_escrow")
    .select("id, status")
    .eq("swap_id", swap.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing && existing.status === "held") {
    return NextResponse.json({ error: "Escrow already held for this user", escrow: existing }, { status: 409 });
  }

  const stripe = getStripe();

  let paymentIntentId: string | null = null;
  let clientSecret: string | null = null;

  if (stripe) {
    // Real Stripe: create PaymentIntent with manual capture
    const intent = await stripe.paymentIntents.create({
      amount: ESCROW_AMOUNT_BANI,
      currency: "ron",
      capture_method: "manual",
      metadata: {
        type: "swap_escrow",
        swapId: swap.id,
        userId,
      },
      description: `Swaply escrow guarantee — swap ${swap.id.slice(0, 8)}`,
    });
    paymentIntentId = intent.id;
    clientSecret = intent.client_secret;
  } else {
    // Mock mode for development
    paymentIntentId = `pi_mock_${Date.now()}_${userId.slice(0, 8)}`;
    clientSecret = `secret_mock_${Date.now()}`;
  }

  // Insert escrow record
  const { data: escrow, error: insertErr } = await db
    .from("swap_escrow")
    .insert({
      swap_id: swap.id,
      user_id: userId,
      amount_ron: ESCROW_AMOUNT_RON,
      stripe_payment_intent_id: paymentIntentId,
      status: "held",
    })
    .select("*")
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ escrow, clientSecret });
}

// --- Release: cancel (void) the authorization → money returns to user ---
async function handleRelease(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  swap: { id: string; requester_id: string; responder_id: string },
) {
  // Check both parties confirmed
  const { data: swapFull } = await db
    .from("swaps")
    .select("requester_confirmed, responder_confirmed")
    .eq("id", swap.id)
    .maybeSingle();

  if (!swapFull?.requester_confirmed || !swapFull?.responder_confirmed) {
    return NextResponse.json({ error: "Both parties must confirm delivery before escrow release" }, { status: 422 });
  }

  // Get all held escrows for this swap
  const { data: escrows } = await db
    .from("swap_escrow")
    .select("*")
    .eq("swap_id", swap.id)
    .eq("status", "held");

  if (!escrows || escrows.length === 0) {
    return NextResponse.json({ error: "No held escrows found" }, { status: 404 });
  }

  const stripe = getStripe();
  const released: string[] = [];

  for (const esc of escrows) {
    // Cancel the PaymentIntent (releases the hold)
    if (stripe && esc.stripe_payment_intent_id && !esc.stripe_payment_intent_id.startsWith("pi_mock_")) {
      try {
        await stripe.paymentIntents.cancel(esc.stripe_payment_intent_id);
      } catch (err) {
        console.error(`[escrow/release] Failed to cancel PI ${esc.stripe_payment_intent_id}:`, err);
      }
    }

    // Update status
    await db
      .from("swap_escrow")
      .update({ status: "released", released_at: new Date().toISOString() })
      .eq("id", esc.id);

    released.push(esc.id);
  }

  return NextResponse.json({ released, count: released.length });
}

// --- Dispute: hold the escrow until admin resolution ---
async function handleDispute(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  swap: { id: string; requester_id: string; responder_id: string },
  userId: string,
  reason?: string,
) {
  // Mark all escrows for this swap as disputed
  const { data: updated, error: updateErr } = await db
    .from("swap_escrow")
    .update({ status: "disputed" })
    .eq("swap_id", swap.id)
    .eq("status", "held")
    .select("*");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  // Log the dispute event
  await db
    .from("swap_events")
    .insert({
      swap_id: swap.id,
      actor_id: userId,
      action: "escrow_disputed",
      metadata: { reason: reason ?? "user_initiated" },
    })
    .then(({ error: logErr }: { error: { message: string } | null }) => {
      if (logErr) console.error("[escrow/dispute] event log error:", logErr.message);
    });

  return NextResponse.json({ disputed: updated ?? [], count: updated?.length ?? 0 });
}
