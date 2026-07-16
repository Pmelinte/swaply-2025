import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSwapStatus, type SwapStatus } from "@/lib/swaps/lifecycle";
import {
  mapSwapTransitionErrorStatus,
  transitionSwap,
} from "@/lib/swaps/transitionService";

type TransitionBody = {
  swapId?: string;
  expectedStatus?: string;
  toStatus?: string;
  idempotencyKey?: string;
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TransitionBody;
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

  if (toStatus === "cancelled") {
    return NextResponse.json(
      {
        error: "Cancellation requires the canonical cancel endpoint",
        code: "CANCEL_AUTHORITY_REQUIRED",
      },
      { status: 409 },
    );
  }

  if (toStatus === "disputed") {
    return NextResponse.json(
      {
        error: "Dispute opening requires the canonical dispute endpoint",
        code: "DISPUTE_AUTHORITY_REQUIRED",
      },
      { status: 409 },
    );
  }

  let expectedStatus: SwapStatus | undefined;
  if (body.expectedStatus !== undefined) {
    if (!isSwapStatus(body.expectedStatus)) {
      return NextResponse.json(
        { error: `Invalid expected status: ${body.expectedStatus}` },
        { status: 400 },
      );
    }
    expectedStatus = body.expectedStatus;
  }

  // Compatibility path for callers that have not yet started sending CAS state.
  // The database RPC still performs compare-and-set under a row lock.
  if (!expectedStatus) {
    const { data: swap, error } = await supabase
      .from("swaps")
      .select("status")
      .eq("id", swapId)
      .maybeSingle();

    if (error || !swap) {
      return NextResponse.json({ error: "Swap not found" }, { status: 404 });
    }

    if (!isSwapStatus(swap.status)) {
      return NextResponse.json(
        { error: `Unsupported current status: ${String(swap.status)}` },
        { status: 409 },
      );
    }
    expectedStatus = swap.status;
  }

  const idempotencyKey =
    request.headers.get("idempotency-key") ?? body.idempotencyKey;

  const result = await transitionSwap(supabase, {
    swapId,
    expectedStatus,
    toStatus,
    idempotencyKey,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
      },
      { status: mapSwapTransitionErrorStatus(result.error.code) },
    );
  }

  return NextResponse.json({
    swap: result.data.swap,
    replayed: result.data.replayed,
    idempotencyKey: result.data.idempotency_key,
  });
}
