/**
 * POST /api/travel/car-rental
 * Returns car rental affiliate links.
 */
import { NextRequest, NextResponse } from "next/server";
import { getCarRentalLinks } from "@/lib/payments/car-rental";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  if (!body.pickupCity || !body.pickupDate || !body.dropoffDate) {
    return NextResponse.json({ error: "pickupCity, pickupDate și dropoffDate sunt obligatorii" }, { status: 400 });
  }

  const links = getCarRentalLinks({
    pickupCity: String(body.pickupCity),
    pickupDate: String(body.pickupDate),
    pickupTime: body.pickupTime ? String(body.pickupTime) : undefined,
    dropoffDate: String(body.dropoffDate),
    dropoffTime: body.dropoffTime ? String(body.dropoffTime) : undefined,
    dropoffCity: body.dropoffCity ? String(body.dropoffCity) : undefined,
    driverAge: body.driverAge ? Number(body.driverAge) : undefined,
    currency: body.currency ? String(body.currency) : undefined,
  });

  return NextResponse.json({ links });
}
