/**
 * POST /api/payments/webhook
 * Stripe webhook handler — processes payment events.
 *
 * Events handled:
 *   checkout.session.completed              → credit tokens or activate subscription
 *   checkout.session.async_payment_succeeded → fulfil after delayed payment (bank transfer, etc.)
 *   checkout.session.async_payment_failed    → mark transaction failed for delayed payment
 *   checkout.session.expired                 → clean up abandoned checkout sessions
 *   payment_intent.succeeded                → activate boost/featured/insurance
 *   customer.subscription.deleted           → downgrade to free
 *   invoice.paid                            → renew subscription + monthly tokens
 *   invoice.payment_failed                  → notify user
 */
import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/payments/stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Semnătură lipsă" }, { status: 400 });
  }

  const event = constructWebhookEvent(body, signature);
  if (!event) {
    return NextResponse.json({ error: "Semnătură invalidă" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as {
          metadata?: Record<string, string>;
          customer?: string;
          subscription?: string;
        };
        const meta = session.metadata ?? {};

        if (meta.type === "token_purchase") {
          // Credit tokens to user
          const userId = meta.userId;
          const tokens = parseInt(meta.tokens ?? "0", 10);
          console.log(`[webhook] Token purchase: ${tokens} tokens → user ${userId}`);

          // In production: INSERT into token_ledger via Supabase
          // await supabase.from("token_ledger").insert({
          //   user_id: userId,
          //   amount: tokens,
          //   reason: "purchase",
          //   description: `Stripe: ${meta.packageId}`,
          // });
        }

        if (meta.type === "subscription") {
          // Activate subscription
          const userId = meta.userId;
          const planId = meta.planId;
          console.log(`[webhook] Subscription activated: ${planId} → user ${userId}`);

          // In production: UPSERT into subscriptions via Supabase
          // await supabase.from("subscriptions").upsert({
          //   user_id: userId,
          //   plan_id: planId,
          //   status: "active",
          //   stripe_customer_id: session.customer,
          //   stripe_subscription_id: session.subscription,
          //   current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          // });
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as {
          metadata?: Record<string, string>;
          customer?: string;
          subscription?: string;
        };
        const meta = session.metadata ?? {};

        if (meta.type === "token_purchase") {
          const userId = meta.userId;
          const tokens = parseInt(meta.tokens ?? "0", 10);
          console.log(`[webhook] Async payment succeeded (tokens): ${tokens} → user ${userId}`);
          // In production: INSERT into token_ledger via Supabase
        }

        if (meta.type === "subscription") {
          const userId = meta.userId;
          const planId = meta.planId;
          console.log(`[webhook] Async payment succeeded (subscription): ${planId} → user ${userId}`);
          // In production: UPSERT into subscriptions via Supabase
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as {
          metadata?: Record<string, string>;
        };
        const meta = session.metadata ?? {};
        console.log(`[webhook] Async payment failed: type=${meta.type}, user ${meta.userId}`);
        // In production: UPDATE payment_transactions SET status = 'failed', notify user
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as {
          metadata?: Record<string, string>;
        };
        const meta = session.metadata ?? {};
        console.log(`[webhook] Checkout session expired: type=${meta.type}, user ${meta.userId}`);
        // In production: UPDATE payment_transactions SET status = 'expired', clean up pending records
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as { metadata?: Record<string, string> };
        const meta = intent.metadata ?? {};
        const type = meta.type;

        if (type === "boost_24h" || type === "featured_48h" || type === "super_boost_7d") {
          console.log(`[webhook] Boost activated: ${type} → item ${meta.itemId} → user ${meta.userId}`);
          // In production: INSERT into featured_listings or update item boost status
        }

        if (type === "swap_insurance") {
          console.log(`[webhook] Insurance activated: swap ${meta.swapId} → user ${meta.userId}`);
          // In production: INSERT into swap_insurance
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as { metadata?: Record<string, string> };
        const meta = subscription.metadata ?? {};
        console.log(`[webhook] Subscription cancelled: user ${meta.userId}`);
        // In production: UPDATE subscriptions SET status = 'canceled', plan_id = 'free'
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as {
          subscription_details?: { metadata?: Record<string, string> };
        };
        const meta = invoice.subscription_details?.metadata ?? {};
        console.log(`[webhook] Invoice paid: user ${meta.userId}, plan ${meta.planId}`);
        // In production: Grant monthly tokens based on plan
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as {
          subscription_details?: { metadata?: Record<string, string> };
        };
        const meta = invoice.subscription_details?.metadata ?? {};
        console.log(`[webhook] Payment failed: user ${meta.userId}`);
        // In production: Send notification to user, update subscription status to past_due
        break;
      }

      default:
        console.log(`[webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Processing error:", err);
    return NextResponse.json({ error: "Eroare la procesarea webhook" }, { status: 500 });
  }
}
