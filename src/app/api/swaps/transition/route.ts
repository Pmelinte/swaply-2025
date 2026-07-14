/**
 * POST /api/swaps/transition
 * Canonical server-side Swap lifecycle write authority.
 *
 * The database RPC owns authorization, transition validation, row locking,
 * compare-and-swap and idempotency in one transaction.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isSwapStatus } from "@/lib/swaps/lifecycle";

type TransitionBody = {
  swapId?: string;
  toStatus?: string;
  expectedVersion?: number;
  idempotencyKey?: string;
};

type TransitionRpcResult = {
  swap: Record<string, unknown>;
  idempotent_replay: boolean;
  from_status: string;
  to_status: string;
  resulting_version: number;
};

function statusForRpcError(code?: string): number {
  switch (code) {
    case "28000":
      return 401;
    case "42501":
      return 403;
    case "P0002":
      return 404;
    case "22023":
      return 400;
    case "23514":
      return 422;
    case "40001":
      return 409;
    default:
      return 500;
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { data: current, error: currentError } = await userClient
    .from("swaps")
    .select("id, status, lifecycle_version, requester_id, responder_id")
    .eq("id", swapId)
    .maybeSingle();

  if (currentError || !current) {
    return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  }

  if (current.requester_id !== user.id && current.responder_id !== user.id) {
    return NextResponse.json(
      { error: "Not a participant of this swap" },
      { status: 403 },
    );
  }

  const currentVersion = Number(current.lifecycle_version ?? 0);
  const expectedVersion = body.expectedVersion ?? currentVersion;

  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 0) {
    return NextResponse.json(
      { error: "expectedVersion must be a non-negative integer" },
      { status: 400 },
    );
  }

  // Compatibility/idempotency path for legacy callers that retry after a
  // successful response was lost. No second write or event is produced.
  if (current.status === toStatus) {
    return NextResponse.json({
      swap: current,
      transition: {
        fromStatus: current.status,
        toStatus,
        resultingVersion: currentVersion,
        idempotentReplay: true,
      },
    });
  }

  const suppliedKey =
    body.idempotencyKey ?? request.headers.get("x-idempotency-key") ?? undefined;
  const idempotencyKey =
    suppliedKey?.trim() ||
    `swap:${swapId}:actor:${user.id}:v${expectedVersion}:to:${toStatus}`;

  if (idempotencyKey.length < 8) {
    return NextResponse.json(
      { error: "A stable idempotencyKey of at least 8 characters is required" },
      { status: 400 },
    );
  }

  const { data, error } = await userClient.rpc("transition_swap_lifecycle", {
    p_swap_id: swapId,
    p_to_status: toStatus,
    p_expected_version: expectedVersion,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        currentVersion,
      },
      { status: statusForRpcError(error.code) },
    );
  }

  const result = data as TransitionRpcResult | null;
  if (!result?.swap) {
    return NextResponse.json(
      { error: "Transition returned no swap" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    swap: result.swap,
    transition: {
      fromStatus: result.from_status,
      toStatus: result.to_status,
      resultingVersion: result.resulting_version,
      idempotentReplay: result.idempotent_replay,
    },
  });
}
