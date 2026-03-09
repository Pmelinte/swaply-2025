/**
 * POST /api/courier/estimate
 * Returns shipping cost estimates from all configured couriers.
 */
import { NextRequest, NextResponse } from "next/server";
import { getEstimates } from "@/lib/payments/courier";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const senderCounty = String(body.senderCounty ?? "");
  const receiverCounty = String(body.receiverCounty ?? "");
  const weight = Number(body.weight ?? 1);

  if (!senderCounty || !receiverCounty) {
    return NextResponse.json({ error: "senderCounty și receiverCounty sunt obligatorii" }, { status: 400 });
  }

  try {
    const estimates = await getEstimates(senderCounty, receiverCounty, weight);
    return NextResponse.json({ estimates });
  } catch (err) {
    console.error("[courier/estimate] Error:", err);
    return NextResponse.json({ error: "Eroare la calculul estimărilor" }, { status: 500 });
  }
}
