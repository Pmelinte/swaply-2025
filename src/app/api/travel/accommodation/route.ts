/**
 * POST /api/travel/accommodation
 * Returns accommodation affiliate links for house swap users.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAccommodationLinks } from "@/lib/payments/booking-affiliate";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  if (!body.city || !body.checkIn || !body.checkOut) {
    return NextResponse.json({ error: "city, checkIn și checkOut sunt obligatorii" }, { status: 400 });
  }

  const links = getAccommodationLinks({
    city: String(body.city),
    countryCode: body.countryCode ? String(body.countryCode) : undefined,
    checkIn: String(body.checkIn),
    checkOut: String(body.checkOut),
    guests: Number(body.guests ?? 1),
    rooms: body.rooms ? Number(body.rooms) : undefined,
    latitude: body.latitude ? Number(body.latitude) : undefined,
    longitude: body.longitude ? Number(body.longitude) : undefined,
  });

  return NextResponse.json({ links });
}
