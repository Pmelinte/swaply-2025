/**
 * POST /api/travel/flights
 * Searches for flights and returns affiliate links.
 */
import { NextRequest, NextResponse } from "next/server";
import { searchFlights, getFlightAffiliateLinks } from "@/lib/payments/flights";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  if (!body.originCity || !body.destinationCity || !body.departDate) {
    return NextResponse.json({ error: "originCity, destinationCity și departDate sunt obligatorii" }, { status: 400 });
  }

  const params = {
    originCity: String(body.originCity),
    destinationCity: String(body.destinationCity),
    departDate: String(body.departDate),
    returnDate: body.returnDate ? String(body.returnDate) : undefined,
    adults: Number(body.adults ?? 1),
    children: body.children ? Number(body.children) : undefined,
    cabinClass: (body.cabinClass as "economy" | "business" | "first") ?? "economy",
    currency: String(body.currency ?? "EUR"),
  };

  try {
    // Return affiliate links always; API search only if Kiwi is configured
    const affiliateLinks = getFlightAffiliateLinks(params);
    const searchResults = await searchFlights(params);

    return NextResponse.json({
      ...searchResults,
      affiliateLinks,
    });
  } catch (err) {
    console.error("[travel/flights] Error:", err);
    return NextResponse.json({
      results: [],
      affiliateLinks: getFlightAffiliateLinks(params),
      error: "Căutarea zborurilor nu este disponibilă momentan",
    });
  }
}
