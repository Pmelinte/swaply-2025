/**
 * POST /api/swaps/transition
 *
 * The only application endpoint allowed to request a global Swap/Exchange
 * status transition. Authentication happens here; authorization, expected-state
 * CAS, idempotency and the write itself happen atomically in PostgreSQL.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  allowedSwapTransitions,
  buildSwapTransitionIdempotencyKey,
  isSwapStatus,
} from "@/lib/swaps/lifecycle";
import { transitionSwapStatusAuthoritatively } from "@/lib/swaps/transitionAuthority";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

  let body: {
    swapId?: string;
    expectedStatus?: string;
    toStatus?: string;
    idempotencyKey?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { swapId, expectedStatus, toStatus } = body;
  if (!swapId || !expectedStatus || !toStatus) {
    return NextResponse.json(
      { error: "swapId, expectedStatus and toStatus are required" },
      { status: 400 },
    );
  }

  if (!isSwapStatus(expectedStatus) || !isSwapStatus(toStatus)) {
    return NextResponse.json(
      { error: "Invalid swap status" },
      { status: 400 },
    );
  }

  const idempotencyKey =
    body.idempotencyKey ??
    request.headers.get("idempotency-key") ??
    buildSwapTransitionIdempotencyKey(swapId, expectedStatus, toStatus);

  try {
    const result = await transitionSwapStatusAuthoritatively({
      swapId,
      actorId: user.id,
      expectedStatus,
      toStatus,
      idempotencyKey,
    });

    switch (result.outcome) {
      case "applied":
      case "replayed":
        if (!result.swap) {
          return NextResponse.json(
            { error: "Transition authority returned no swap" },
            { status: 500 },
          );
        }
        return NextResponse.json({
          swap: result.swap,
          transition: {
            outcome: result.outcome,
            replayed: result.replayed,
            actorRole: result.actorRole,
            fromStatus: result.fromStatus,
            toStatus: result.toStatus,
          },
        });

      case "not_found":
        return NextResponse.json({ error: "Swap not found" }, { status: 404 });

      case "not_participant":
      case "not_authorized":
        return NextResponse.json(
          {
            error:
              result.reason ??
              "The authenticated participant cannot perform this transition",
          },
          { status: 403 },
        );

      case "stale_state":
        return NextResponse.json(
          {
            error: "Stale swap status",
            expectedStatus,
            currentStatus: result.currentStatus,
          },
          { status: 409 },
        );

      case "idempotency_conflict":
        return NextResponse.json(
          { error: "Idempotency key was reused with a different transition" },
          { status: 409 },
        );

      case "invalid_transition":
        return NextResponse.json(
          {
            error: `Invalid transition: ${expectedStatus} → ${toStatus}`,
            allowed: allowedSwapTransitions(expectedStatus),
          },
          { status: 422 },
        );

      case "invalid_request":
        return NextResponse.json(
          { error: "Invalid transition request" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("[swap-transition] authority error:", error);
    return NextResponse.json(
      { error: "Swap transition authority failed" },
      { status: 500 },
    );
  }
}
