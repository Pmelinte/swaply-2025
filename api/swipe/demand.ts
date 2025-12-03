import { NextResponse } from "next/server";
import createClient from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { swiperId, offeredItemId, wantsItem } = body;

    if (!swiperId || !offeredItemId || wantsItem === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("fake_swipes_demand")
      .upsert(
        {
          swiper_id: swiperId,
          offered_item_id: offeredItemId,
          wants_item: wantsItem,
          source_zone: "bottom",
        },
        { onConflict: "swiper_id, offered_item_id" }
      )
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
