/**
 * POST /api/payments/paypal/create
 * Creates a PayPal order for token purchase.
 */
import { NextRequest, NextResponse } from "next/server";
import { createTokenOrder, isPayPalConfigured } from "@/lib/payments/paypal";
import { getFeatureFlag } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  if (!isPayPalConfigured() || !(await getFeatureFlag("paypal_payments"))) {
    return NextResponse.json({ error: "PayPal nu este configurat" }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json() as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { packageId, userId } = body;
  if (!packageId || !userId) {
    return NextResponse.json({ error: "packageId și userId sunt obligatorii" }, { status: 400 });
  }

  try {
    const result = await createTokenOrder({ packageId, userId });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ orderId: result.orderId });
  } catch (err) {
    console.error("[paypal/create] Error:", err);
    return NextResponse.json({ error: "Eroare la crearea comenzii PayPal" }, { status: 500 });
  }
}
