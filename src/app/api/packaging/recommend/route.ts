/**
 * POST /api/packaging/recommend
 * Returns packaging recommendations and supplier links.
 */
import { NextRequest, NextResponse } from "next/server";
import { recommendPackaging, getPackagingSupplierLinks, getSwapKits, getPackagingGuidance } from "@/lib/payments/packaging";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const lengthCm = Number(body.lengthCm ?? 20);
  const widthCm = Number(body.widthCm ?? 15);
  const heightCm = Number(body.heightCm ?? 10);
  const weightKg = Number(body.weightKg ?? 1);
  const isFragile = Boolean(body.isFragile);
  const itemCategory = String(body.category ?? "general");
  const itemCondition = (body.condition as "new" | "good" | "used") ?? "good";

  const recommendation = recommendPackaging(lengthCm, widthCm, heightCm, weightKg, isFragile);
  const suppliers = getPackagingSupplierLinks();
  const kits = getSwapKits();
  const guidance = getPackagingGuidance(itemCategory, itemCondition);

  return NextResponse.json({
    recommendation,
    suppliers,
    kits,
    guidance,
  });
}
