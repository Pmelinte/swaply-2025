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
 * TEMPORAR DISABLED (build fix)
 *
 * Motiv: proiectul NU are instalat pachetul `stripe`.
 * TypeScript verifică importurile la build și crapă, chiar dacă importul era "dinamic".
 *
 * Când vrei să activezi:
 * 1) instalezi pachetul `stripe`
 * 2) refacem endpoint-ul să creeze checkout session.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  // păstrăm auth + validare plan, ca endpoint-ul să rămână “corect” logic
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

  if (!plan || (plan !== "silver" && plan !== "gold" && plan !== "platinum")) {
    return NextResponse.json(
      { ok: false, error: "missing_or_invalid_plan" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "stripe_disabled",
      message:
        "Billing este dezactivat momentan: pachetul 'stripe' nu este instalat în proiect.",
    },
    { status: 501 },
  );
}
