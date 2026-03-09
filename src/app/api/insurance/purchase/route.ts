/**
 * POST /api/insurance/purchase
 * Purchases an insurance policy from a quote.
 */
import { NextRequest, NextResponse } from "next/server";
import { purchaseInsurance } from "@/lib/payments/insurance";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  if (!body.quoteId || !body.userId) {
    return NextResponse.json({ error: "quoteId și userId sunt obligatorii" }, { status: 400 });
  }

  try {
    const policy = await purchaseInsurance(String(body.quoteId), String(body.userId));

    if (!policy) {
      return NextResponse.json({ error: "Nu s-a putut achiziționa asigurarea" }, { status: 500 });
    }

    return NextResponse.json({ policy });
  } catch (err) {
    console.error("[insurance/purchase] Error:", err);
    return NextResponse.json({ error: "Eroare la achiziționarea asigurării" }, { status: 500 });
  }
}
