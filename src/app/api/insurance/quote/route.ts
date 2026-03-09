/**
 * POST /api/insurance/quote
 * Returns an insurance quote for shipping, travel, or property.
 */
import { NextRequest, NextResponse } from "next/server";
import { getInsuranceQuote } from "@/lib/payments/insurance";
import type { InsuranceType } from "@/lib/payments/insurance";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const validTypes = ["shipping", "travel", "property"];
  if (!body.type || !validTypes.includes(String(body.type))) {
    return NextResponse.json({ error: `type trebuie să fie unul din: ${validTypes.join(", ")}` }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId este obligatoriu" }, { status: 400 });
  }

  try {
    const quote = await getInsuranceQuote({
      type: String(body.type) as InsuranceType,
      itemValue: body.itemValue ? Number(body.itemValue) : undefined,
      shippingProvider: body.shippingProvider ? String(body.shippingProvider) : undefined,
      originCountry: body.originCountry ? String(body.originCountry) : undefined,
      destCountry: body.destCountry ? String(body.destCountry) : undefined,
      travelStartDate: body.travelStartDate ? String(body.travelStartDate) : undefined,
      travelEndDate: body.travelEndDate ? String(body.travelEndDate) : undefined,
      travelers: body.travelers ? Number(body.travelers) : undefined,
      destinationCountry: body.destinationCountry ? String(body.destinationCountry) : undefined,
      propertyValue: body.propertyValue ? Number(body.propertyValue) : undefined,
      stayDays: body.stayDays ? Number(body.stayDays) : undefined,
      currency: body.currency ? String(body.currency) : undefined,
      userId: String(body.userId),
      swapId: body.swapId ? String(body.swapId) : undefined,
    });

    return NextResponse.json({ quote });
  } catch (err) {
    console.error("[insurance/quote] Error:", err);
    return NextResponse.json({ error: "Eroare la calculul cotației de asigurare" }, { status: 500 });
  }
}
