/**
 * POST /api/audit
 * Lightweight endpoint for client-side audit logging.
 * Accepts action details and forwards to logAction() (service role).
 */
import { NextRequest, NextResponse } from "next/server";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { userId, action, entityType, entityId, oldData, newData } = body;

  if (!userId || !action || !entityType) {
    return NextResponse.json(
      { error: "userId, action, entityType sunt obligatorii" },
      { status: 400 },
    );
  }

  await logAction({
    userId: String(userId),
    action: String(action),
    entityType: String(entityType),
    entityId: entityId ? String(entityId) : undefined,
    oldData: oldData as Record<string, unknown> | undefined,
    newData: newData as Record<string, unknown> | undefined,
    request,
  });

  return NextResponse.json({ ok: true });
}
