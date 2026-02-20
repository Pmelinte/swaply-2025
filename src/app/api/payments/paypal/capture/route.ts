/**
 * POST /api/payments/paypal/capture
 * Captures a PayPal order after buyer approval.
 */
import { NextRequest, NextResponse } from "next/server";
import { captureOrder, isPayPalConfigured } from "@/lib/payments/paypal";

export async function POST(request: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "PayPal nu este configurat" }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json() as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { orderId } = body;
  if (!orderId) {
    return NextResponse.json({ error: "orderId este obligatoriu" }, { status: 400 });
  }

  try {
    const result = await captureOrder(orderId);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Plata nu a fost finalizată" }, { status: 400 });
    }

    // On success, credit tokens
    if (result.metadata) {
      console.log(`[paypal/capture] Token purchase: ${result.metadata.tokens} tokens → user ${result.metadata.userId}`);
      // In production: INSERT into token_ledger via Supabase
    }

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      tokens: result.metadata?.tokens ?? 0,
    });
  } catch (err) {
    console.error("[paypal/capture] Error:", err);
    return NextResponse.json({ error: "Eroare la capturarea plății PayPal" }, { status: 500 });
  }
}
