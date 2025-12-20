import { NextResponse } from "next/server";
import { requireApiClient } from "@/lib/api/public-api";
import { estimateItemPrice } from "@/lib/ai/estimate-price";

type RequestBody = {
  title?: string;
  category?: string;
  condition?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiClient(request, "price/estimate");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const estimate = estimateItemPrice(body);

  return NextResponse.json(
    {
      ok: true,
      estimate: {
        eur: estimate.eur,
        ron: estimate.ron,
        currency: ["EUR", "RON"],
      },
    },
    { status: 200 }
  );
}
