/**
 * GET /api/dhl/track?trackingNumber=...
 * Tracks a DHL Express shipment.
 */
import { NextRequest, NextResponse } from "next/server";
import { trackDHLShipment } from "@/lib/payments/dhl";

export async function GET(request: NextRequest) {
  const trackingNumber = request.nextUrl.searchParams.get("trackingNumber");

  if (!trackingNumber) {
    return NextResponse.json({ error: "trackingNumber este obligatoriu" }, { status: 400 });
  }

  try {
    const result = await trackDHLShipment(trackingNumber);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[dhl/track] Error:", err);
    return NextResponse.json({ error: "Eroare la urmărirea coletului DHL" }, { status: 500 });
  }
}
