/**
 * POST /api/dhl/rates
 * Returns DHL Express shipping rate estimates.
 */
import { NextRequest, NextResponse } from "next/server";
import { getDHLRates } from "@/lib/payments/dhl";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const sender = body.sender as Record<string, string> | undefined;
  const receiver = body.receiver as Record<string, string> | undefined;

  if (!sender?.countryCode || !sender?.city || !receiver?.countryCode || !receiver?.city) {
    return NextResponse.json({ error: "sender și receiver cu countryCode și city sunt obligatorii" }, { status: 400 });
  }

  try {
    const rates = await getDHLRates({
      sender: {
        name: sender.name ?? "",
        phone: sender.phone ?? "",
        addressLine1: sender.addressLine1 ?? "",
        city: sender.city,
        postalCode: sender.postalCode ?? "",
        countryCode: sender.countryCode,
      },
      receiver: {
        name: receiver.name ?? "",
        phone: receiver.phone ?? "",
        addressLine1: receiver.addressLine1 ?? "",
        city: receiver.city,
        postalCode: receiver.postalCode ?? "",
        countryCode: receiver.countryCode,
      },
      weight: Number(body.weight ?? 1),
      width: body.width ? Number(body.width) : undefined,
      height: body.height ? Number(body.height) : undefined,
      length: body.length ? Number(body.length) : undefined,
      contents: String(body.contents ?? "Swap item"),
      swapId: String(body.swapId ?? ""),
    });

    return NextResponse.json({ rates });
  } catch (err) {
    console.error("[dhl/rates] Error:", err);
    return NextResponse.json({ error: "Eroare la calculul tarifelor DHL" }, { status: 500 });
  }
}
