/**
 * POST /api/courier/create-awb
 * Creates an AWB (shipping label) with the selected courier.
 * Revenue: Swaply adds a markup (5-10%) on the base shipping cost.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAWB } from "@/lib/payments/courier";
import type { AWBRequest, CourierProvider, ShippingAddress } from "@/lib/payments/courier";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const { provider, sender, receiver, weight, contents, swapId, paymentBy } = body;

  if (!provider || !sender || !receiver || !weight || !contents || !swapId) {
    return NextResponse.json({
      error: "Câmpuri obligatorii: provider, sender, receiver, weight, contents, swapId",
    }, { status: 400 });
  }

  const awbRequest: AWBRequest = {
    provider: provider as CourierProvider,
    sender: sender as ShippingAddress,
    receiver: receiver as ShippingAddress,
    weight: Number(weight),
    width: Number(body.width ?? 20),
    height: Number(body.height ?? 15),
    length: Number(body.length ?? 30),
    declaredValue: body.declaredValue ? Number(body.declaredValue) : undefined,
    contents: String(contents),
    swapId: String(swapId),
    paymentBy: (paymentBy === "receiver" ? "receiver" : "sender") as AWBRequest["paymentBy"],
  };

  try {
    const result = await createAWB(awbRequest);

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Eroare la crearea AWB" }, { status: 400 });
    }

    return NextResponse.json({
      awbNumber: result.awbNumber,
      estimatedCost: result.estimatedCost,
      swaplyFee: result.swaplyFee,
      totalCost: result.totalCost,
      estimatedDelivery: result.estimatedDelivery,
      trackingUrl: result.trackingUrl,
    });
  } catch (err) {
    console.error("[courier/create-awb] Error:", err);
    return NextResponse.json({ error: "Eroare la generarea AWB" }, { status: 500 });
  }
}
