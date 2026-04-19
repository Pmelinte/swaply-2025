import { NextRequest, NextResponse } from "next/server";

// KILL SWITCH 2026-04-19 — investigating runaway API consumption.
// Original implementation (batched UI-string translation via
// /v1/messages, claude-haiku-4-5-20251001, up to 50 keys/request with 529
// exponential-backoff retry) preserved in git history.
// Revert this commit to restore.

/**
 * POST /api/admin/translate-ui
 * DISABLED — returns 503 until RCA completes.
 */
export async function POST(_req: NextRequest) {
  console.warn("[admin/translate-ui] DISABLED — kill switch active");
  return NextResponse.json(
    { error: "Translation temporarily disabled pending investigation" },
    { status: 503 },
  );
}
