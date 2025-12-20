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

const PRICE_IDS: Record<Plan, string | undefined> = {
  silver: process.env.STRIPE_PRICE_ID_SILVER,
  gold: process.env.STRIPE_PRICE_ID_GOLD,
  platinum: process.env.STRIPE_PRICE_ID_PLATINUM,
};

export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
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

  const body = (await req.json().catch(() => ({}))) as Body;
  const plan = body.plan;

  if (!plan || !(plan in PRICE_IDS)) {
    return NextResponse.json(
      { ok: false, error: "missing_or_invalid_plan" },
      { status: 400 },
    );
  }

  const priceId = PRICE_IDS[plan];
  const secret = process.env.STRIPE_SECRET_KEY;
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  if (!secret || !priceId || !origin) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 500 },
    );
  }

  const params = new URLSearchParams();
  params.set("mode", "subscription");
  params.set("success_url", `${origin}/premium?status=success`);
  params.set("cancel_url", `${origin}/premium?status=cancelled`);
  params.set("customer_email", user.email ?? "");
  params.set("line_items[0][price]", priceId);
  params.set("line_items[0][quantity]", "1");
  params.set("metadata[user_id]", user.id);
  params.set("metadata[plan]", plan);

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!stripeRes.ok) {
    const errorText = await stripeRes.text().catch(() => "");
    return NextResponse.json(
      { ok: false, error: "stripe_error", message: errorText },
      { status: 502 },
    );
  }

  const session = await stripeRes.json();

  await supabase.from("payments").insert({
    user_id: user.id,
    stripe_session_id: session.id,
    amount: 0,
    currency: "EUR",
    type: "subscription",
    status: "pending",
  });

  return NextResponse.json({ ok: true, url: session.url });
}
