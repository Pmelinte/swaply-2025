/**
 * POST /api/travel/ground-transport
 * Returns bus, train, and carpool links.
 */
import { NextRequest, NextResponse } from "next/server";
import { getGroundTransportLinks, estimateGroundTransport } from "@/lib/payments/ground-transport";
import type { GroundTransportMode } from "@/lib/payments/ground-transport";

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
    passengers: body.passengers ? Number(body.passengers) : undefined,
    mode: body.mode as GroundTransportMode | undefined,
  };

  const links = getGroundTransportLinks(params);
  const estimates = estimateGroundTransport(params.originCity, params.destinationCity);

  return NextResponse.json({ links, estimates });
}
