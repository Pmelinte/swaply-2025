import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api/api-client";

function estimate(category?: string, condition?: string) {
  const base: Record<string, number> = {
    electronics: 250,
    furniture: 150,
    fashion: 40,
    books: 15,
    sports: 80,
    toys: 35,
    home: 60,
    other: 50,
  };
  const key = category && base[category] ? category : "other";
  const basePrice = base[key];

  const multiplier = condition === "new" ? 1.2 : condition === "like_new" ? 1.1 : condition === "fair" ? 0.8 : condition === "poor" ? 0.6 : 1;
  const eur = Math.round(basePrice * multiplier);
  return { eur, ron: Math.round(eur * 5) };
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest("public:price");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { eur, ron } = estimate(body?.category, body?.condition);

  return NextResponse.json({ ok: true, priceEstimateEur: eur, priceEstimateRon: ron });
}
