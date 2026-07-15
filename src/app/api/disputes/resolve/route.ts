import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  isCanonicalDisputeResolution,
  validateResolutionNotes,
} from "@/lib/swaps/disputePolicy";
import {
  mapDisputeErrorStatus,
  resolveSwapDispute,
} from "@/lib/swaps/disputeService";

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
    disputeId?: string;
    resolution?: string;
    notes?: string;
    idempotencyKey?: string;
  };

  if (!body.disputeId || !isCanonicalDisputeResolution(body.resolution)) {
    return NextResponse.json(
      { error: "Dispute ID and canonical resolution are required" },
      { status: 422 },
    );
  }

  const notesResult = validateResolutionNotes(body.notes);
  if (!notesResult.ok) {
    return NextResponse.json(
      { error: notesResult.message },
      { status: 422 },
    );
  }

  const fingerprint = createHash("sha256")
    .update(`${body.resolution}:${notesResult.notes}`)
    .digest("hex")
    .slice(0, 24);
  const idempotencyKey = (
    request.headers.get("idempotency-key") ??
    body.idempotencyKey ??
    `dispute-resolution:${body.disputeId}:${user.id}:${fingerprint}`
  ).trim();

  const result = await resolveSwapDispute(supabase, {
    disputeId: body.disputeId,
    resolution: body.resolution,
    notes: notesResult.notes,
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

  return NextResponse.json(result.data);
}
