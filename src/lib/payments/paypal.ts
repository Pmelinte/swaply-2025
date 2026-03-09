/**
 * PayPal integration for Swaply.
 * Alternative payment method for token purchases and subscriptions.
 *
 * Env vars required:
 *   PAYPAL_CLIENT_ID
 *   PAYPAL_CLIENT_SECRET
 *   NEXT_PUBLIC_PAYPAL_CLIENT_ID
 *   PAYPAL_WEBHOOK_ID
 *
 * PayPal mode determined by PAYPAL_MODE (sandbox|live), defaults to sandbox.
 */

import { TOKEN_PACKAGES, SUBSCRIPTION_PLANS } from "../monetization";

// ── Config ──

const PAYPAL_MODE = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
const BASE_URL = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

// ── Auth ──

async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) return null;

  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

// ── Create Order: Token Purchase ──

export interface PayPalOrderParams {
  packageId: string;
  userId: string;
}

export async function createTokenOrder(params: PayPalOrderParams): Promise<{ orderId: string | null; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { orderId: null, error: "PayPal nu este configurat" };

  const pkg = TOKEN_PACKAGES.find((p) => p.id === params.packageId);
  if (!pkg) return { orderId: null, error: `Pachet invalid: ${params.packageId}` };

  const res = await fetch(`${BASE_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: `tokens_${params.packageId}_${params.userId}`,
          description: `Swaply Tokens — ${pkg.label} (${pkg.tokens} tokens)`,
          custom_id: JSON.stringify({ type: "token_purchase", packageId: pkg.id, tokens: pkg.tokens, userId: params.userId }),
          amount: {
            currency_code: "EUR",
            value: pkg.priceEur.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Swaply",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { orderId: null, error: `PayPal error: ${body}` };
  }

  const data = await res.json() as { id?: string };
  return { orderId: data.id ?? null };
}

// ── Capture Order (after buyer approves) ──

export interface PayPalCaptureResult {
  success: boolean;
  orderId: string;
  status: string;
  metadata?: {
    type: string;
    packageId: string;
    tokens: number;
    userId: string;
  };
  error?: string;
}

export async function captureOrder(orderId: string): Promise<PayPalCaptureResult> {
  const token = await getAccessToken();
  if (!token) return { success: false, orderId, status: "ERROR", error: "PayPal nu este configurat" };

  const res = await fetch(`${BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return { success: false, orderId, status: "ERROR", error: body };
  }

  const data = await res.json() as {
    id?: string;
    status?: string;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ custom_id?: string }> };
    }>;
  };

  // Extract metadata from custom_id
  let metadata: PayPalCaptureResult["metadata"];
  try {
    const customId = data.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
    if (customId) {
      metadata = JSON.parse(customId);
    }
  } catch { /* ignore parse errors */ }

  return {
    success: data.status === "COMPLETED",
    orderId: data.id ?? orderId,
    status: data.status ?? "UNKNOWN",
    metadata,
  };
}

// ── Create Subscription (PayPal Billing) ──

export interface PayPalSubscriptionParams {
  planId: "premium" | "platinum";
  interval: "monthly" | "yearly";
  userId: string;
  returnUrl: string;
  cancelUrl: string;
}

export async function createSubscription(params: PayPalSubscriptionParams): Promise<{ approvalUrl: string | null; subscriptionId: string | null; error?: string }> {
  const token = await getAccessToken();
  if (!token) return { approvalUrl: null, subscriptionId: null, error: "PayPal nu este configurat" };

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === params.planId);
  if (!plan) return { approvalUrl: null, subscriptionId: null, error: `Plan invalid: ${params.planId}` };

  const price = params.interval === "yearly" ? plan.priceYearly : plan.priceMonthly;

  // First, create a billing plan
  const planRes = await fetch(`${BASE_URL}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: `swaply_${params.planId}`,
      name: `Swaply ${plan.name} — ${params.interval}`,
      billing_cycles: [
        {
          frequency: {
            interval_unit: params.interval === "yearly" ? "YEAR" : "MONTH",
            interval_count: 1,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: "EUR",
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        payment_failure_threshold: 3,
      },
    }),
  });

  if (!planRes.ok) {
    return { approvalUrl: null, subscriptionId: null, error: "Nu s-a putut crea planul PayPal" };
  }

  const planData = await planRes.json() as { id?: string };
  if (!planData.id) return { approvalUrl: null, subscriptionId: null, error: "Plan ID lipsă" };

  // Create subscription
  const subRes = await fetch(`${BASE_URL}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan_id: planData.id,
      custom_id: JSON.stringify({ userId: params.userId, planId: params.planId }),
      application_context: {
        brand_name: "Swaply",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
        user_action: "SUBSCRIBE_NOW",
      },
    }),
  });

  if (!subRes.ok) {
    return { approvalUrl: null, subscriptionId: null, error: "Nu s-a putut crea abonamentul" };
  }

  const subData = await subRes.json() as { id?: string; links?: Array<{ rel: string; href: string }> };
  const approvalLink = subData.links?.find((l) => l.rel === "approve");

  return {
    approvalUrl: approvalLink?.href ?? null,
    subscriptionId: subData.id ?? null,
  };
}

// ── Webhook Verification ──

export async function verifyWebhook(
  headers: Record<string, string>,
  body: string,
): Promise<boolean> {
  const token = await getAccessToken();
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!token || !webhookId) return false;

  const res = await fetch(`${BASE_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      webhook_id: webhookId,
      transmission_id: headers["paypal-transmission-id"],
      transmission_time: headers["paypal-transmission-time"],
      cert_url: headers["paypal-cert-url"],
      auth_algo: headers["paypal-auth-algo"],
      transmission_sig: headers["paypal-transmission-sig"],
      webhook_event: JSON.parse(body),
    }),
  });

  if (!res.ok) return false;
  const data = await res.json() as { verification_status?: string };
  return data.verification_status === "SUCCESS";
}
