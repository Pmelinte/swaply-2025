/**
 * POST /api/payments/checkout
 * Creates a Stripe Checkout session for token purchases or subscriptions.
 * Accepts: Visa, Mastercard, Apple Pay, Google Pay.
 */
import { NextRequest, NextResponse } from "next/server";
import { createTokenCheckout, createSubscriptionCheckout, createOneTimePayment, isStripeConfigured } from "@/lib/payments/stripe";
import { getFeatureFlag } from "@/lib/feature-flags";

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !(await getFeatureFlag("stripe_payments"))) {
    return NextResponse.json({ error: "Stripe nu este configurat" }, { status: 503 });
  }

  let body: Record<string, string>;
  try {
    body = await request.json() as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { type, userId, userEmail } = body;
  if (!type || !userId || !userEmail) {
    return NextResponse.json({ error: "type, userId, userEmail sunt obligatorii" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "https://swaply.world";
  // Allow caller to specify return page (pricing vs monetization)
  const returnPage = body.returnPage ?? "monetization";
  const successUrl = `${origin}/${returnPage}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/${returnPage}?payment=cancelled`;

  try {
    // Token purchase
    if (type === "token_purchase") {
      const { packageId } = body;
      if (!packageId) return NextResponse.json({ error: "packageId obligatoriu" }, { status: 400 });

      const result = await createTokenCheckout({
        packageId,
        userId,
        userEmail,
        successUrl,
        cancelUrl,
      });

      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ url: result.url });
    }

    // Subscription
    if (type === "subscription") {
      const planId = body.planId as "premium" | "platinum";
      const interval = (body.interval ?? "monthly") as "monthly" | "yearly";
      if (!planId || !["premium", "platinum"].includes(planId)) {
        return NextResponse.json({ error: "planId invalid (premium | platinum)" }, { status: 400 });
      }

      const result = await createSubscriptionCheckout({
        planId,
        interval,
        userId,
        userEmail,
        successUrl: `${origin}/${returnPage}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl,
      });

      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ url: result.url });
    }

    // One-time payment (boost, featured, insurance)
    if (type === "one_time") {
      const paymentType = body.paymentType as "boost_24h" | "featured_48h" | "super_boost_7d" | "swap_insurance";
      if (!paymentType) return NextResponse.json({ error: "paymentType obligatoriu" }, { status: 400 });

      const result = await createOneTimePayment({
        type: paymentType,
        userId,
        userEmail,
        itemId: body.itemId,
        swapId: body.swapId,
      });

      if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ clientSecret: result.clientSecret });
    }

    return NextResponse.json({ error: `Tip necunoscut: ${type}` }, { status: 400 });
  } catch (err) {
    console.error("[payments/checkout] Error:", err);
    return NextResponse.json({ error: "Eroare internă la procesarea plății" }, { status: 500 });
  }
}
