import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { swiperId, desiredItemId, canSupply } = body;

    if (!swiperId || !desiredItemId || canSupply === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("fake_swipes_supply")
      .upsert(
        {
          swiper_id: swiperId,
          desired_item_id: desiredItemId,
          can_supply: canSupply,
          source_zone: "top",
        },
        { onConflict: "swiper_id, desired_item_id" }
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
