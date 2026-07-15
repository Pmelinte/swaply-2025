import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  isCanonicalDisputeReason,
  isDisputableSwapStatus,
  validateDisputeDescription,
  validateDisputeEvidence,
} from "@/lib/swaps/disputePolicy";
import {
  buildOpenDisputeIdempotencyKey,
  mapDisputeErrorStatus,
  openSwapDispute,
} from "@/lib/swaps/disputeService";

export async function GET(request: Request) {
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
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const swapId = new URL(request.url).searchParams.get("swap_id");
  let query = supabase
    .from("disputes")
    .select("*, dispute_evidence(*)")
    .order("created_at", { ascending: false });

  if (swapId) query = query.eq("swap_id", swapId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ disputes: data ?? [] });
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    swapId?: string;
    expectedStatus?: string;
    reason?: string;
    description?: string;
    evidence?: unknown;
    idempotencyKey?: string;
  };

  if (!body.swapId || !isCanonicalDisputeReason(body.reason)) {
    return NextResponse.json(
      { error: "A Swap ID and canonical dispute reason are required" },
      { status: 422 },
    );
  }

  const descriptionResult = validateDisputeDescription(body.description);
  if (!descriptionResult.ok) {
    return NextResponse.json(
      { error: descriptionResult.message },
      { status: 422 },
    );
  }

  const evidenceResult = validateDisputeEvidence(body.evidence);
  if (!evidenceResult.ok) {
    return NextResponse.json(
      { error: evidenceResult.message },
      { status: 422 },
    );
  }

  let expectedStatus = body.expectedStatus;
  if (!isDisputableSwapStatus(expectedStatus)) {
    const { data: swap, error } = await supabase
      .from("swaps")
      .select("status")
      .eq("id", body.swapId)
      .maybeSingle();

    if (error || !swap) {
      return NextResponse.json({ error: "Swap not found" }, { status: 404 });
    }
    expectedStatus = swap.status;
  }

  if (!isDisputableSwapStatus(expectedStatus)) {
    return NextResponse.json(
      { error: "Only accepted or in-progress Swaps may be disputed" },
      { status: 409 },
    );
  }

  const idempotencyKey = (
    request.headers.get("idempotency-key") ??
    body.idempotencyKey ??
    buildOpenDisputeIdempotencyKey({ swapId: body.swapId, actorId: user.id })
  ).trim();

  const result = await openSwapDispute(supabase, {
    swapId: body.swapId,
    expectedStatus,
    reason: body.reason,
    description: descriptionResult.description,
    evidence: evidenceResult.evidence,
    idempotencyKey,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error.message,
        code: result.error.code,
        details: result.error.details,
      },
      { status: mapDisputeErrorStatus(result.error.code) },
    );
  }

  return NextResponse.json(result.data, {
    status: result.data.replayed ? 200 : 201,
  });
}
