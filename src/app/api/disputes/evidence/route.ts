import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { validateDisputeEvidence } from "@/lib/swaps/disputePolicy";
import {
  addSwapDisputeEvidence,
  mapDisputeErrorStatus,
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
    evidenceType?: string;
    content?: string;
    idempotencyKey?: string;
  };

  if (!body.disputeId) {
    return NextResponse.json({ error: "Dispute ID is required" }, { status: 422 });
  }

  const evidenceResult = validateDisputeEvidence([
    { evidenceType: body.evidenceType, content: body.content },
  ]);
  if (!evidenceResult.ok) {
    return NextResponse.json(
      { error: evidenceResult.message },
      { status: 422 },
    );
  }

  const evidence = evidenceResult.evidence[0];
  const fingerprint = createHash("sha256")
    .update(`${evidence.evidenceType}:${evidence.content}`)
    .digest("hex")
    .slice(0, 24);
  const idempotencyKey = (
    request.headers.get("idempotency-key") ??
    body.idempotencyKey ??
    `dispute-evidence:${body.disputeId}:${user.id}:${fingerprint}`
  ).trim();

  const result = await addSwapDisputeEvidence(supabase, {
    disputeId: body.disputeId,
    evidenceType: evidence.evidenceType,
    content: evidence.content,
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
