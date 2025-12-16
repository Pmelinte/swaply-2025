// src/app/api/billing/checkout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type Plan = "silver" | "gold" | "platinum";

type ApiResponse =
  | { ok: true; url: string }
  | { ok: false; error: string; message?: string };

type Body = {
  plan?: Plan;
};

/**
 * POST /api/billing/checkout
 *
 * Creează o sesiune Stripe Checkout pentru abonamente (ranguri premium).
 *
 * Necesită env:
 *  - STRIPE_SECRET_KEY
 *  - STRIPE_PRICE_SILVER
 *  - STRIPE_PRICE_GOLD
 *  - STRIPE_PRICE_PLATINUM
 *  - NEXT_PUBLIC_SITE_URL (ex: https://swaply.world)
 *
 * Body:
 *  { plan: "silver" | "gold" | "platinum" }
 *
 * Răspuns:
 *  { ok: true, url: "<stripe_checkout_url>" }
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    // 1) Auth (doar user logat poate iniția checkout)
    const supabase = createServerClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    // 2) Parse body
    const body = (await req.json().catch(() => ({}))) as Body;
    const plan = body.plan;

    if (!plan || (plan !== "silver" && plan !== "gold" && plan !== "platinum")) {
      return NextResponse.json(
        { ok: false, error: "missing_or_invalid_plan" },
        { status: 400 },
      );
    }

    // 3) Env checks
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

    const priceId =
      plan === "silver"
        ? process.env.STRIPE_PRICE_SILVER
        : plan === "gold"
          ? process.env.STRIPE_PRICE_GOLD
          : process.env.STRIPE_PRICE_PLATINUM;

    if (!secretKey) {
      return NextResponse.json(
        { ok: false, error: "stripe_not_configured_missing_secret" },
        { status: 500 },
      );
    }

    if (!priceId) {
      return NextResponse.json(
        { ok: false, error: "stripe_not_configured_missing_price" },
        { status: 500 },
      );
    }

    if (!siteUrl) {
      return NextResponse.json(
        { ok: false, error: "site_url_not_configured" },
        { status: 500 },
      );
    }

    // 4) Stripe SDK — IMPORTANT:
    // Dacă pachetul `stripe` nu e instalat, facem fallback (fără crash la build).
    let StripeCtor: any = null;
    try {
      StripeCtor = (await import("stripe")).default;
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "stripe_sdk_missing",
          message:
            "Pachetul 'stripe' nu este instalat. Instalează-l sau dezactivează billing-ul.",
        },
        { status: 501 },
      );
    }

    const stripe = new StripeCtor(secretKey, {
      apiVersion: "2024-06-20",
    });

    // 5) Build success/cancel URLs
    const successUrl = `${siteUrl}/settings/billing?success=1`;
    const cancelUrl = `${siteUrl}/settings/billing?canceled=1`;

    // 6) Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,

      metadata: {
        user_id: user.id,
        plan,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { ok: false, error: "stripe_session_missing_url" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  } catch (err) {
    console.error("[BILLING_CHECKOUT_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
