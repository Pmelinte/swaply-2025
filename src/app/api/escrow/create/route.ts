/**
 * POST /api/escrow/create
 * Creates an escrow transaction for a swap.
 */
import { NextRequest, NextResponse } from "next/server";
import { createEscrowTransaction } from "@/lib/payments/escrow";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  if (!body.swapId || !body.requester || !body.responder) {
    return NextResponse.json({ error: "swapId, requester și responder sunt obligatorii" }, { status: 400 });
  }

  const requester = body.requester as Record<string, string>;
  const responder = body.responder as Record<string, string>;

  try {
    const transaction = await createEscrowTransaction({
      swapId: String(body.swapId),
      title: String(body.title ?? "Swaply Swap"),
      description: String(body.description ?? "Schimb de obiecte prin Swaply"),
      declaredValue: Number(body.declaredValue ?? 50),
      currency: String(body.currency ?? "EUR"),
      requester: {
        role: "buyer",
        email: requester.email ?? "",
        name: requester.name ?? "",
        phone: requester.phone,
      },
      responder: {
        role: "seller",
        email: responder.email ?? "",
        name: responder.name ?? "",
        phone: responder.phone,
      },
      inspectionDays: body.inspectionDays ? Number(body.inspectionDays) : undefined,
    });

    return NextResponse.json(transaction);
  } catch (err) {
    console.error("[escrow/create] Error:", err);
    return NextResponse.json({ error: "Eroare la crearea tranzacției escrow" }, { status: 500 });
  }
}
