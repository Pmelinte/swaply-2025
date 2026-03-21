/**
 * POST /api/payments/portal
 * Creates a Stripe Customer Portal session so users can manage their subscription.
 */
import { NextRequest, NextResponse } from "next/server";
import { createPortalSession, isStripeConfigured } from "@/lib/payments/stripe";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe nu este configurat" }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json() as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { stripeCustomerId } = body;
  if (!stripeCustomerId) {
    return NextResponse.json({ error: "stripeCustomerId obligatoriu" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "https://swaply.world";
  const returnUrl = `${origin}/pricing`;

  try {
    const result = await createPortalSession(stripeCustomerId, returnUrl);
    if (!result.url) {
      return NextResponse.json({ error: "Nu s-a putut crea sesiunea de portal" }, { status: 500 });
    }
    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("[payments/portal] Error:", err);
    return NextResponse.json({ error: "Eroare internă" }, { status: 500 });
  }
}
