import { NextRequest, NextResponse } from "next/server";

// KILL SWITCH 2026-04-19 — investigating runaway API consumption.
// Original implementation (claude-haiku-4-5-20251001 MDX translation via
// /v1/messages with chunked content sections) preserved in git history.
// Revert this commit to restore.

/**
 * POST /api/admin/translate-blog
 * DISABLED — returns 503 until RCA completes.
 */
export async function POST(_req: NextRequest) {
  console.warn("[admin/translate-blog] DISABLED — kill switch active");
  return NextResponse.json(
    { error: "Translation temporarily disabled pending investigation" },
    { status: 503 },
  );
}
