import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  isCancellableSwapStatus,
  validateCancelReason,
} from "@/lib/swaps/cancelPolicy";
import {
  cancelSwap,
  mapSwapCancelErrorStatus,
} from "@/lib/swaps/cancelService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured" },
      { status: 500 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    expectedStatus?: string;
    reason?: string;
    idempotencyKey?: string;
  };

  if (!isCancellableSwapStatus(body.expectedStatus)) {
    return NextResponse.json(
      { error: "A cancellable expected status is required" },
      { status: 422 },
    );
  }

  const reasonResult = validateCancelReason(body.expectedStatus, body.reason);
  if (!reasonResult.ok) {
    return NextResponse.json(
      { error: reasonResult.message },
      { status: 422 },
    );
  }

  const idempotencyKey = (
    request.headers.get("idempotency-key") ??
    body.idempotencyKey ??
    ""
  ).trim();

  if (!idempotencyKey) {
    return NextResponse.json(
      { error: "Idempotency key is required" },
      { status: 422 },
    );
  }

  const { id } = await params;
  const result = await cancelSwap(supabase, {
    swapId: id,
    expectedStatus: body.expectedStatus,
    reason: reasonResult.reason,
    idempotencyKey,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
      },
      { status: mapSwapCancelErrorStatus(result.error.code) },
    );
  }

  return NextResponse.json(result.data);
}
