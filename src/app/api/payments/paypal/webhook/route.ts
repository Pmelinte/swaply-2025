/**
 * POST /api/payments/paypal/webhook
 * Handles PayPal webhook events:
 *   - PAYMENT.CAPTURE.COMPLETED → credit tokens / activate boost or premium
 *   - BILLING.SUBSCRIPTION.ACTIVATED → activate subscription
 *   - BILLING.SUBSCRIPTION.CANCELLED → downgrade to free
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook, isPayPalConfigured } from "@/lib/payments/paypal";
import { getServiceSupabase } from "@/lib/supabase/service";

interface WebhookEvent {
  event_type: string;
  resource: {
    id?: string;
    status?: string;
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    purchase_units?: Array<{
      payments?: { captures?: Array<{ custom_id?: string; amount?: { value?: string } }> };
    }>;
  };
}

export async function POST(request: NextRequest) {
  if (!isPayPalConfigured()) {
    return NextResponse.json({ error: "PayPal not configured" }, { status: 503 });
  }

  const body = await request.text();

  // Collect headers for verification
  const headers: Record<string, string> = {};
  for (const key of [
    "paypal-transmission-id",
    "paypal-transmission-time",
    "paypal-cert-url",
    "paypal-auth-algo",
    "paypal-transmission-sig",
  ]) {
    headers[key] = request.headers.get(key) ?? "";
  }

  // Verify webhook signature (skip in development if no webhook ID configured)
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (webhookId) {
    const isValid = await verifyWebhook(headers, body);
    if (!isValid) {
      console.error("[paypal/webhook] Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(body) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[paypal/webhook] Event: ${event.event_type}`);

  try {
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCaptureCompleted(event);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(event);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionCancelled(event);
        break;

      default:
        console.log(`[paypal/webhook] Unhandled event: ${event.event_type}`);
    }
  } catch (err) {
    console.error(`[paypal/webhook] Error handling ${event.event_type}:`, err);
    // Return 200 to prevent PayPal from retrying
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentCaptureCompleted(event: WebhookEvent) {
  // Extract metadata from custom_id
  const customIdRaw =
    event.resource.custom_id ??
    event.resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

  if (!customIdRaw) {
    console.log("[paypal/webhook] No custom_id in capture event");
    return;
  }

  let metadata: { type?: string; packageId?: string; tokens?: number; userId?: string };
  try {
    metadata = JSON.parse(customIdRaw);
  } catch {
    console.error("[paypal/webhook] Failed to parse custom_id:", customIdRaw);
    return;
  }

  if (metadata.type === "token_purchase" && metadata.userId && metadata.tokens) {
    console.log(`[paypal/webhook] Token purchase: ${metadata.tokens} tokens → user ${metadata.userId}`);

    const supabase = getServiceSupabase();
    if (supabase) {
      // Credit tokens
      await supabase.from("token_ledger").insert({
        user_id: metadata.userId,
        amount: metadata.tokens,
        type: "purchase",
        description: `PayPal token purchase — ${metadata.packageId}`,
        reference_id: event.resource.id,
      });

      // Record transaction
      await supabase.from("payment_transactions").insert({
        user_id: metadata.userId,
        provider: "paypal",
        provider_id: event.resource.id,
        type: "token_purchase",
        status: "completed",
        amount_cents: Math.round(
          parseFloat(event.resource.amount?.value ?? "0") * 100,
        ),
        currency: event.resource.amount?.currency_code ?? "EUR",
        metadata: metadata,
      });
    }
  }
}

async function handleSubscriptionActivated(event: WebhookEvent) {
  const customIdRaw = event.resource.custom_id;
  if (!customIdRaw) return;

  let metadata: { userId?: string; planId?: string };
  try {
    metadata = JSON.parse(customIdRaw);
  } catch {
    return;
  }

  if (!metadata.userId || !metadata.planId) return;

  console.log(`[paypal/webhook] Subscription activated: ${metadata.planId} → user ${metadata.userId}`);

  const supabase = getServiceSupabase();
  if (supabase) {
    await supabase.from("subscriptions").upsert({
      user_id: metadata.userId,
      plan: metadata.planId,
      status: "active",
      provider: "paypal",
      provider_subscription_id: event.resource.id,
    });

    // Update badge
    const badge = metadata.planId === "platinum" ? "platinum" : "premium";
    await supabase
      .from("profiles")
      .update({ badge })
      .eq("user_id", metadata.userId);
  }
}

async function handleSubscriptionCancelled(event: WebhookEvent) {
  const customIdRaw = event.resource.custom_id;
  if (!customIdRaw) return;

  let metadata: { userId?: string };
  try {
    metadata = JSON.parse(customIdRaw);
  } catch {
    return;
  }

  if (!metadata.userId) return;

  console.log(`[paypal/webhook] Subscription cancelled → user ${metadata.userId}`);

  const supabase = getServiceSupabase();
  if (supabase) {
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("user_id", metadata.userId)
      .eq("provider", "paypal");

    await supabase
      .from("profiles")
      .update({ badge: "free" })
      .eq("user_id", metadata.userId);
  }
}
