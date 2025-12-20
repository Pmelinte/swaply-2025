import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api/api-client";

function scoreItem(item: any, wishlist: any[]) {
  let bestScore = 0;
  for (const entry of wishlist) {
    let score = 0;
    if (entry.category && item.category === entry.category) score += 0.4;
    if (entry.subcategory && item.subcategory === entry.subcategory) score += 0.3;
    if (entry.condition && item.condition === entry.condition) score += 0.1;
    score += 0.1; // popularity placeholder

    if (score > bestScore) bestScore = score;
  }
  return Number(bestScore.toFixed(2));
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest("public:matching");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const wishlist = Array.isArray(body?.wishlist) ? body.wishlist : [];
  const items = Array.isArray(body?.items) ? body.items : [];

  const matches = items.map((item) => ({
    item,
    score: scoreItem(item, wishlist),
  }));

  matches.sort((a, b) => b.score - a.score);

  return NextResponse.json({ ok: true, matches });
}
