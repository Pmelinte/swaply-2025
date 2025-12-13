// src/app/api/billing/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Stripe Webhook – primește evenimentele de la Stripe
 *
 * Necesită env:
 *  - STRIPE_SECRET_KEY
 *  - STRIPE_WEBHOOK_SECRET
 *
 * Evenimente tratate (skeleton):
 *  - checkout.session.completed
 *  - customer.subscription.updated
 *  - customer.subscription.deleted
 *
 * IMPORTANT:
 *  - acest endpoint NU folosește Supabase Auth
 *  - validarea se face exclusiv prin semnătura Stripe
 */

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secretKey || !webhookSecret) {
      return NextResponse.json(
        { ok: false, error: "stripe_not_configured" },
        { status: 500 },
      );
    }

    // Stripe SDK – import dinamic
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(secretKey, {
      apiVersion: "2024-06-20",
    });

    // Stripe cere body RAW
    const body = await req.text();
    const sig = headers().get("stripe-signature");

    if (!sig) {
      return NextResponse.json(
        { ok: false, error: "missing_stripe_signature" },
        { status: 400 },
      );
    }

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        webhookSecret,
      );
    } catch (err) {
      console.error("[STRIPE_WEBHOOK_SIGNATURE_ERROR]", err);
      return NextResponse.json(
        { ok: false, error: "invalid_signature" },
        { status: 400 },
      );
    }

    // ------------------------------------------------
    // Handle events (skeleton logic)
    // ------------------------------------------------
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        /**
         * Aici, în viitor:
         *  - session.metadata.user_id
         *  - session.metadata.plan
         *  - session.subscription
         * -> salvăm abonamentul în DB
         * -> activăm rangul (silver/gold/platinum)
         */
        console.log("[STRIPE] checkout.session.completed", {
          userId: session?.metadata?.user_id,
          plan: session?.metadata?.plan,
          subscription: session?.subscription,
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        /**
         * Aici, în viitor:
         *  - schimbare plan
         *  - suspendare / reluare
         */
        console.log("[STRIPE] subscription.updated", subscription.id);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        /**
         * Aici, în viitor:
         *  - dezactivare rang
         *  - downgrade user
         */
        console.log("[STRIPE] subscription.deleted", subscription.id);
        break;
      }

      default:
        // alte evenimente – ignorate elegant
        console.log("[STRIPE] unhandled event:", event.type);
    }

    // Stripe cere 200 OK ca să considere webhook-ul procesat
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[STRIPE_WEBHOOK_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}