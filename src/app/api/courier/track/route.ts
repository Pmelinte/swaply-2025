/**
 * GET /api/courier/track?awb=XXX&provider=fancourier
 * Tracks an AWB across courier providers.
 */
import { NextRequest, NextResponse } from "next/server";
import { trackAWB } from "@/lib/payments/courier";
import type { CourierProvider } from "@/lib/payments/courier";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const awb = searchParams.get("awb");
  const provider = searchParams.get("provider") as CourierProvider | null;

  if (!awb || !provider) {
    return NextResponse.json({ error: "awb and provider are required" }, { status: 400 });
  }

  if (!["fancourier", "sameday", "cargus"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  try {
    const result = await trackAWB(awb, provider);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[courier/track] Error:", err);
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }
}
