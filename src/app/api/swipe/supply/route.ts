// src/app/api/swipe/supply/route.ts

import { NextResponse } from "next/server";
import { supplySwipeAction } from "@/features/swipe/server/swipe-actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const itemId = body.itemId;
    const direction = body.direction;

    if (!itemId || !direction) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const result = await supplySwipeAction(itemId, direction);

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("POST /api/swipe/supply error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 },
    );
  }
}
