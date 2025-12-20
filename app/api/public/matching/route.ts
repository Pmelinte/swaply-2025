import { NextResponse } from "next/server";
import { requireApiClient } from "@/lib/api/public-api";

type WishlistEntry = {
  category?: string | null;
  subcategory?: string | null;
  condition?: string | null;
  location?: string | null;
};

type ItemCandidate = {
  id: string;
  title?: string | null;
  category?: string | null;
  subcategory?: string | null;
  condition?: string | null;
  location?: string | null;
};

type RequestBody = {
  wishlist?: WishlistEntry[];
  items?: ItemCandidate[];
};

function scoreCandidate(entry: WishlistEntry, item: ItemCandidate): number {
  let score = 0;

  if (entry.category && item.category && entry.category === item.category) {
    score += 0.4;
  }

  if (
    entry.subcategory &&
    item.subcategory &&
    entry.subcategory === item.subcategory
  ) {
    score += 0.3;
  }

  if (entry.condition && item.condition && entry.condition === item.condition) {
    score += 0.1;
  }

  if (entry.location && item.location && item.location.includes(entry.location)) {
    score += 0.1;
  }

  return score;
}

export async function POST(request: Request) {
  const auth = await requireApiClient(request, "matching");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const wishlist = body.wishlist ?? [];
  const items = body.items ?? [];

  if (wishlist.length === 0 || items.length === 0) {
    return NextResponse.json(
      { ok: true, matches: [], reason: "empty_input" },
      { status: 200 }
    );
  }

  const scored = items.map((item) => {
    const best = wishlist.reduce(
      (max, entry) => Math.max(max, scoreCandidate(entry, item)),
      0
    );

    return {
      item,
      score: Number(best.toFixed(2)),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return NextResponse.json(
    {
      ok: true,
      matches: scored.slice(0, 50),
    },
    { status: 200 }
  );
}
