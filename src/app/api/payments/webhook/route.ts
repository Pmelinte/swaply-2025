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
import { getServiceSupabase } from "@/lib/supabase/service";

// ── Helpers ──

async function creditTokens(userId: string, amount: number, reason: string, description: string) {
  const sb = getServiceSupabase();
  if (!sb) return;

  await sb.from("token_ledger").insert({
    user_id: userId,
    amount,
    reason,
    description,
  });
}

async function upsertSubscription(
  userId: string,
  planId: string,
  interval: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
) {
  const sb = getServiceSupabase();
  if (!sb) return;

  await sb.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: "active",
      billing_cycle: interval,
      stripe_customer_id: stripeCustomerId ?? null,
      stripe_subscription_id: stripeSubscriptionId ?? null,
      current_period_end: new Date(Date.now() + (interval === "yearly" ? 365 : 30) * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Also store stripe_customer_id on profile for portal access
  if (stripeCustomerId) {
    await sb.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", userId);
  }
}

async function recordTransaction(
  userId: string,
  providerId: string,
  type: string,
  amountCents: number,
  currency: string,
  status: string,
  metadata?: Record<string, string>,
) {
  const sb = getServiceSupabase();
  if (!sb) return;

  await sb.from("payment_transactions").insert({
    user_id: userId,
    provider: "stripe",
    provider_id: providerId,
    type,
    amount_cents: amountCents,
    currency,
    status,
    metadata: metadata ?? {},
  });
}

// ── Webhook Handler ──

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
          id?: string;
          metadata?: Record<string, string>;
          customer?: string;
          subscription?: string;
          amount_total?: number;
          currency?: string;
        };
        const meta = session.metadata ?? {};

        if (meta.type === "token_purchase") {
          const tokens = parseInt(meta.tokens ?? "0", 10);
          await creditTokens(meta.userId, tokens, "purchase", `Stripe: ${meta.packageId}`);
          await recordTransaction(
            meta.userId,
            session.id ?? "",
            "token_purchase",
            session.amount_total ?? 0,
            session.currency ?? "eur",
            "completed",
            meta,
          );
          console.log(`[webhook] Token purchase: ${tokens} tokens → user ${meta.userId}`);
        }

        if (meta.type === "subscription") {
          await upsertSubscription(
            meta.userId,
            meta.planId,
            meta.interval ?? "monthly",
            session.customer as string | undefined,
            session.subscription as string | undefined,
          );
          await recordTransaction(
            meta.userId,
            session.id ?? "",
            "subscription",
            session.amount_total ?? 0,
            session.currency ?? "eur",
            "completed",
            meta,
          );
          console.log(`[webhook] Subscription activated: ${meta.planId} → user ${meta.userId}`);
        }
        break;
      }

      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as {
          id?: string;
          metadata?: Record<string, string>;
          customer?: string;
          subscription?: string;
          amount_total?: number;
          currency?: string;
        };
        const meta = session.metadata ?? {};

        if (meta.type === "token_purchase") {
          const tokens = parseInt(meta.tokens ?? "0", 10);
          await creditTokens(meta.userId, tokens, "purchase", `Stripe async: ${meta.packageId}`);
          await recordTransaction(meta.userId, session.id ?? "", "token_purchase", session.amount_total ?? 0, session.currency ?? "eur", "completed", meta);
          console.log(`[webhook] Async payment succeeded (tokens): ${tokens} → user ${meta.userId}`);
        }

        if (meta.type === "subscription") {
          await upsertSubscription(meta.userId, meta.planId, meta.interval ?? "monthly", session.customer as string | undefined, session.subscription as string | undefined);
          await recordTransaction(meta.userId, session.id ?? "", "subscription", session.amount_total ?? 0, session.currency ?? "eur", "completed", meta);
          console.log(`[webhook] Async payment succeeded (subscription): ${meta.planId} → user ${meta.userId}`);
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as {
          id?: string;
          metadata?: Record<string, string>;
          amount_total?: number;
          currency?: string;
        };
        const meta = session.metadata ?? {};
        await recordTransaction(meta.userId, session.id ?? "", meta.type ?? "unknown", session.amount_total ?? 0, session.currency ?? "eur", "failed", meta);
        console.log(`[webhook] Async payment failed: type=${meta.type}, user ${meta.userId}`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as {
          id?: string;
          metadata?: Record<string, string>;
        };
        const meta = session.metadata ?? {};
        // Update any pending transaction to expired status
        const sb = getServiceSupabase();
        if (sb && session.id) {
          await sb
            .from("payment_transactions")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("provider_id", session.id)
            .eq("status", "pending");
        }
        console.log(`[webhook] Checkout session expired: type=${meta.type}, user ${meta.userId}`);
        break;
      }

      case "payment_intent.succeeded": {
        const intent = event.data.object as {
          id?: string;
          metadata?: Record<string, string>;
          amount?: number;
          currency?: string;
        };
        const meta = intent.metadata ?? {};
        const type = meta.type;

        if (type === "boost_24h" || type === "featured_48h" || type === "super_boost_7d") {
          const sb = getServiceSupabase();
          if (sb && meta.itemId) {
            const durationHours = type === "super_boost_7d" ? 168 : type === "featured_48h" ? 48 : 24;
            await sb.from("featured_listings").insert({
              item_id: meta.itemId,
              user_id: meta.userId,
              expires_at: new Date(Date.now() + durationHours * 3600000).toISOString(),
            });
          }
          await recordTransaction(meta.userId, intent.id ?? "", type, intent.amount ?? 0, intent.currency ?? "eur", "completed", meta);
          console.log(`[webhook] Boost activated: ${type} → item ${meta.itemId} → user ${meta.userId}`);
        }

        if (type === "swap_insurance") {
          const sb = getServiceSupabase();
          if (sb && meta.swapId) {
            await sb.from("swap_insurance").insert({
              swap_id: meta.swapId,
              buyer_id: meta.userId,
              cost: intent.amount ?? 0,
              expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            });
          }
          await recordTransaction(meta.userId, intent.id ?? "", "swap_insurance", intent.amount ?? 0, intent.currency ?? "eur", "completed", meta);
          console.log(`[webhook] Insurance activated: swap ${meta.swapId} → user ${meta.userId}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as {
          id?: string;
          metadata?: Record<string, string>;
        };
        const meta = subscription.metadata ?? {};

        const sb = getServiceSupabase();
        if (sb && meta.userId) {
          await sb
            .from("subscriptions")
            .update({
              status: "canceled",
              plan_id: "free",
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", meta.userId);
        }
        console.log(`[webhook] Subscription cancelled: user ${meta.userId}`);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as {
          subscription_details?: { metadata?: Record<string, string> };
        };
        const meta = invoice.subscription_details?.metadata ?? {};

        if (meta.userId && meta.planId) {
          // Grant monthly tokens based on plan
          const monthlyTokens = meta.planId === "platinum" ? 999 : meta.planId === "premium" ? 50 : 10;
          await creditTokens(meta.userId, monthlyTokens, "subscription_renewal", `Reînnoire ${meta.planId}: ${monthlyTokens} tokens`);

          // Extend subscription period
          const sb = getServiceSupabase();
          if (sb) {
            await sb
              .from("subscriptions")
              .update({
                status: "active",
                current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", meta.userId);
          }
        }
        console.log(`[webhook] Invoice paid: user ${meta.userId}, plan ${meta.planId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as {
          subscription_details?: { metadata?: Record<string, string> };
        };
        const meta = invoice.subscription_details?.metadata ?? {};

        if (meta.userId) {
          const sb = getServiceSupabase();
          if (sb) {
            await sb
              .from("subscriptions")
              .update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", meta.userId);
          }
        }
        console.log(`[webhook] Payment failed: user ${meta.userId}`);
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
