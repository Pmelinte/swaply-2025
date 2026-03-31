/**
 * POST /api/payments/boost
 * Creates a Stripe PaymentIntent (RON) for item visibility boost.
 *
 * Body: { itemId, userId, userEmail, duration: "24h" | "72h" | "7d" }
 * Returns: { clientSecret, paymentIntentId }
 */
import { NextRequest, NextResponse } from "next/server";
import { createBoostPaymentIntent, isStripeConfigured, BOOST_PRICES, type BoostDuration } from "@/lib/payments/stripe";
import { getFeatureFlag } from "@/lib/feature-flags";
import { getServiceSupabase } from "@/lib/supabase/service";

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

  const { itemId, userId, userEmail, duration } = body;

  if (!itemId || !userId || !userEmail || !duration) {
    return NextResponse.json(
      { error: "itemId, userId, userEmail, duration sunt obligatorii" },
      { status: 400 },
    );
  }

  if (!BOOST_PRICES[duration as BoostDuration]) {
    return NextResponse.json(
      { error: `Durată invalidă: ${duration}. Opțiuni: 24h, 72h, 7d` },
      { status: 400 },
    );
  }

  // Verify item exists and belongs to the user
  const sb = getServiceSupabase();
  if (sb) {
    const { data: item } = await sb
      .from("items")
      .select("id, owner_id")
      .eq("id", itemId)
      .eq("status", "active")
      .maybeSingle();

    if (!item) {
      return NextResponse.json({ error: "Obiectul nu a fost găsit" }, { status: 404 });
    }
    if (item.owner_id !== userId) {
      return NextResponse.json({ error: "Nu poți boosta un obiect care nu îți aparține" }, { status: 403 });
    }
  }

  try {
    const result = await createBoostPaymentIntent({
      duration: duration as BoostDuration,
      itemId,
      userId,
      userEmail,
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Pre-create the boost record as pending
    const plan = BOOST_PRICES[duration as BoostDuration];
    if (sb && result.paymentIntentId) {
      try {
        await sb.from("item_boosts").insert({
          item_id: itemId,
          user_id: userId,
          duration_hours: plan.durationHours,
          price_ron: plan.priceRon,
          stripe_payment_intent_id: result.paymentIntentId,
          stripe_payment_status: "pending",
        });
      } catch { /* item_boosts table may not exist yet */ }
    }

    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (err) {
    console.error("[payments/boost] Error:", err);
    return NextResponse.json({ error: "Eroare internă la procesarea plății" }, { status: 500 });
  }
}
