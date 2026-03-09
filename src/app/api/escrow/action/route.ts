/**
 * POST /api/escrow/action
 * Performs an action on an escrow transaction (fund, ship, receive, accept, reject, cancel).
 */
import { NextRequest, NextResponse } from "next/server";
import { performEscrowAction } from "@/lib/payments/escrow";
import type { EscrowAction } from "@/lib/payments/escrow";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const validActions = ["fund", "ship", "receive", "accept", "reject", "cancel"];
  if (!body.action || !validActions.includes(String(body.action))) {
    return NextResponse.json({ error: `action trebuie să fie unul din: ${validActions.join(", ")}` }, { status: 400 });
  }

  if (!body.transactionId || !body.userId) {
    return NextResponse.json({ error: "transactionId și userId sunt obligatorii" }, { status: 400 });
  }

  try {
    const result = await performEscrowAction({
      action: String(body.action) as EscrowAction["action"],
      transactionId: String(body.transactionId),
      userId: String(body.userId),
      trackingNumber: body.trackingNumber ? String(body.trackingNumber) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[escrow/action] Error:", err);
    return NextResponse.json({ error: "Eroare la executarea acțiunii escrow" }, { status: 500 });
  }
}
