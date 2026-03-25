/**
 * Stripe integration for Swaply.
 * Handles: Token purchases (Checkout), Subscriptions (Billing),
 * Boosts/Featured (Payment Intents), Insurance (Payment Intents).
 *
 * Accepts: Visa, Mastercard, American Express, Apple Pay, Google Pay,
 * SEPA Direct Debit, iDEAL (NL), Bancontact (BE) via Stripe.
 *
 * Env vars required:
 *   STRIPE_SECRET_KEY
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   STRIPE_PRICE_PREMIUM_MONTHLY
 *   STRIPE_PRICE_PREMIUM_YEARLY
 *   STRIPE_PRICE_PLATINUM_MONTHLY
 *   STRIPE_PRICE_PLATINUM_YEARLY
 */

import Stripe from "stripe";
import { TOKEN_PACKAGES, SUBSCRIPTION_PLANS } from "../monetization";

// ── Stripe Client ──

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
      typescript: true,
    });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

// ── Checkout Session: Token Purchase ──

export interface TokenCheckoutParams {
  packageId: string;
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createTokenCheckout(params: TokenCheckoutParams): Promise<{ url: string | null; error?: string }> {
  const stripe = getStripe();
  if (!stripe) return { url: null, error: "Stripe is not configured" };

  const pkg = TOKEN_PACKAGES.find((p) => p.id === params.packageId);
  if (!pkg) return { url: null, error: `Invalid package: ${params.packageId}` };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card", "ideal", "bancontact", "sepa_debit"],
    customer_email: params.userEmail,
    metadata: {
      type: "token_purchase",
      packageId: pkg.id,
      tokens: String(pkg.tokens),
      userId: params.userId,
    },
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: Math.round(pkg.priceEur * 100), // cents
          product_data: {
            name: `Swaply Tokens — ${pkg.label}`,
            description: `${pkg.tokens} tokens for your Swaply account`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return { url: session.url };
}

// ── Checkout Session: Subscription ──

export interface SubscriptionCheckoutParams {
  planId: "premium" | "platinum";
  interval: "monthly" | "yearly";
  userId: string;
  userEmail: string;
  successUrl: string;
  cancelUrl: string;
}

/** Maps plan + interval to Stripe Price IDs (from env vars). */
function getStripePriceId(planId: string, interval: string): string | null {
  const key = `STRIPE_PRICE_${planId.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[key] ?? null;
}

export async function createSubscriptionCheckout(params: SubscriptionCheckoutParams): Promise<{ url: string | null; error?: string }> {
  const stripe = getStripe();
  if (!stripe) return { url: null, error: "Stripe is not configured" };

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === params.planId);
  if (!plan) return { url: null, error: `Invalid plan: ${params.planId}` };

  const priceId = getStripePriceId(params.planId, params.interval);

  // RON prices for subscription plans (in bani = RON × 100)
  const ronPrices: Record<string, Record<string, number>> = {
    premium: { monthly: 1900, yearly: 18900 },   // 19 RON/lună, 189 RON/an
    platinum: { monthly: 4900, yearly: 47900 },   // 49 RON/lună, 479 RON/an
  };

  // If no pre-created price, create an ad-hoc price in RON
  const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = priceId
    ? { price: priceId, quantity: 1 }
    : {
        price_data: {
          currency: "ron",
          unit_amount: ronPrices[params.planId]?.[params.interval] ?? Math.round(
            (params.interval === "yearly" ? plan.priceYearly : plan.priceMonthly) * 100,
          ),
          recurring: {
            interval: params.interval === "yearly" ? "year" : "month",
          },
          product_data: {
            name: `Swaply ${plan.name}`,
            description: plan.features.join(", "),
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card", "sepa_debit"],
    customer_email: params.userEmail,
    metadata: {
      type: "subscription",
      planId: params.planId,
      interval: params.interval,
      userId: params.userId,
    },
    line_items: [lineItem],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return { url: session.url };
}

// ── Payment Intent: Boost / Featured / Insurance ──

export type OneTimePaymentType = "boost_24h" | "featured_48h" | "super_boost_7d" | "swap_insurance";

const ONE_TIME_PRODUCTS: Record<OneTimePaymentType, { name: string; amount: number; description: string }> = {
  boost_24h: { name: "Boost 24h", amount: 99, description: "Item promoted for 24 hours" },       // €0.99
  featured_48h: { name: "Featured 48h", amount: 199, description: "Item on homepage for 48h" },   // €1.99
  super_boost_7d: { name: "Super Boost 7 days", amount: 499, description: "Top results + notifications for 7 days" }, // €4.99
  swap_insurance: { name: "Swap Insurance", amount: 299, description: "Full protection for your swap" }, // €2.99
};

export interface OneTimePaymentParams {
  type: OneTimePaymentType;
  userId: string;
  userEmail: string;
  itemId?: string;  // for boost/featured
  swapId?: string;  // for insurance
}

export async function createOneTimePayment(params: OneTimePaymentParams): Promise<{ clientSecret: string | null; error?: string }> {
  const stripe = getStripe();
  if (!stripe) return { clientSecret: null, error: "Stripe is not configured" };

  const product = ONE_TIME_PRODUCTS[params.type];
  if (!product) return { clientSecret: null, error: `Invalid product: ${params.type}` };

  const intent = await stripe.paymentIntents.create({
    amount: product.amount,
    currency: "eur",
    payment_method_types: ["card", "ideal", "bancontact"],
    metadata: {
      type: params.type,
      userId: params.userId,
      itemId: params.itemId ?? "",
      swapId: params.swapId ?? "",
    },
    receipt_email: params.userEmail,
    description: product.description,
  });

  return { clientSecret: intent.client_secret };
}

// ── Payment Intent: Item Boost (RON pricing) ──

export type BoostDuration = "24h" | "72h" | "7d";

export const BOOST_PRICES: Record<BoostDuration, { durationHours: number; priceRon: number; amountBani: number; label: string }> = {
  "24h": { durationHours: 24, priceRon: 5, amountBani: 500, label: "Boost 24h — 5 RON" },
  "72h": { durationHours: 72, priceRon: 12, amountBani: 1200, label: "Boost 72h — 12 RON" },
  "7d":  { durationHours: 168, priceRon: 25, amountBani: 2500, label: "Boost 7 zile — 25 RON" },
};

export interface BoostPaymentParams {
  duration: BoostDuration;
  itemId: string;
  userId: string;
  userEmail: string;
}

export async function createBoostPaymentIntent(params: BoostPaymentParams): Promise<{ clientSecret: string | null; paymentIntentId: string | null; error?: string }> {
  const stripe = getStripe();
  if (!stripe) return { clientSecret: null, paymentIntentId: null, error: "Stripe is not configured" };

  const plan = BOOST_PRICES[params.duration];
  if (!plan) return { clientSecret: null, paymentIntentId: null, error: `Invalid duration: ${params.duration}` };

  const intent = await stripe.paymentIntents.create({
    amount: plan.amountBani,
    currency: "ron",
    payment_method_types: ["card"],
    metadata: {
      type: "item_boost",
      duration: params.duration,
      durationHours: String(plan.durationHours),
      priceRon: String(plan.priceRon),
      itemId: params.itemId,
      userId: params.userId,
    },
    receipt_email: params.userEmail,
    description: `Swaply ${plan.label} — vizibilitate crescută`,
  });

  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

// ── Webhook Verification ──

export function constructWebhookEvent(body: string, signature: string): Stripe.Event | null {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return null;

  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return null;
  }
}

// ── Customer Portal (manage subscription) ──

export async function createPortalSession(customerId: string, returnUrl: string): Promise<{ url: string | null }> {
  const stripe = getStripe();
  if (!stripe) return { url: null };

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return { url: session.url };
}

// ── Exports for product info ──

export { ONE_TIME_PRODUCTS };
export type { Stripe };
