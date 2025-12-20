// src/app/api/billing/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Stripe Webhook – primește evenimentele de la Stripe
 *
 * TEMPORAR DISABLED (build fix)
 *
 * Motiv: pachetul `stripe` NU este instalat, iar TypeScript crapă la build
 * doar pentru că vede importul, chiar dacă era “dinamic”.
 *
 * Când activezi:
 *  1) instalezi `stripe`
 *  2) setezi STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET
 *  3) reintroducem verificarea semnăturii + switch(event.type).
 */

export async function POST(_req: NextRequest): Promise<NextResponse> {
  // păstrez citirea semnăturii ca “hint” că endpoint-ul e ăla corect
  const sig = headers().get("stripe-signature");

  return NextResponse.json(
    {
      ok: false,
      error: "stripe_webhook_disabled",
      message:
        "Webhook Stripe este dezactivat momentan: pachetul 'stripe' nu este instalat/configurat.",
      stripeSignaturePresent: Boolean(sig),
    },
    { status: 501 },
  );
}
