// src/app/api/billing/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = headers().get("stripe-signature");
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!signature || !secret) {
    return NextResponse.json(
      { ok: false, error: "stripe_not_configured" },
      { status: 400 },
    );
  }
  const payload = await req.json().catch(() => null);
  const supabase = createServerClient();

  if (payload?.type === "checkout.session.completed") {
    const session = payload.data?.object;
    const userId = session?.metadata?.user_id ?? null;

    if (userId) {
      await supabase
        .from("payments")
        .update({ status: "paid", stripe_customer_id: session?.customer ?? null })
        .eq("stripe_session_id", session?.id);

      await supabase
        .from("profiles")
        .update({ account_type: "premium" })
        .eq("user_id", userId);
    }
  }

  return NextResponse.json({ ok: true });
}
