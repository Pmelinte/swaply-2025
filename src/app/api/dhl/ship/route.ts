/**
 * POST /api/dhl/ship
 * Creates a DHL Express shipment.
 */
import { NextRequest, NextResponse } from "next/server";
import { createDHLShipment } from "@/lib/payments/dhl";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sender = body.sender as Record<string, string> | undefined;
  const receiver = body.receiver as Record<string, string> | undefined;

  if (!sender?.name || !receiver?.name || !body.swapId) {
    return NextResponse.json({ error: "sender, receiver and swapId are required" }, { status: 400 });
  }

  try {
    const result = await createDHLShipment({
      sender: {
        name: sender.name,
        phone: sender.phone ?? "",
        email: sender.email,
        addressLine1: sender.addressLine1 ?? "",
        addressLine2: sender.addressLine2,
        city: sender.city ?? "",
        postalCode: sender.postalCode ?? "",
        countryCode: sender.countryCode ?? "",
      },
      receiver: {
        name: receiver.name,
        phone: receiver.phone ?? "",
        email: receiver.email,
        addressLine1: receiver.addressLine1 ?? "",
        addressLine2: receiver.addressLine2,
        city: receiver.city ?? "",
        postalCode: receiver.postalCode ?? "",
        countryCode: receiver.countryCode ?? "",
      },
      weight: Number(body.weight ?? 1),
      width: body.width ? Number(body.width) : undefined,
      height: body.height ? Number(body.height) : undefined,
      length: body.length ? Number(body.length) : undefined,
      declaredValue: body.declaredValue ? Number(body.declaredValue) : undefined,
      contents: String(body.contents ?? "Swap item"),
      swapId: String(body.swapId),
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[dhl/ship] Error:", err);
    return NextResponse.json({ error: "Error creating DHL shipment" }, { status: 500 });
  }
}
