import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

function cleanItemId(value: unknown): string | null {
  return typeof value === "string" && value.length >= 8 && value.length <= 128 ? value : null;
}

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ itemIds: [] });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("user_favorites").select("item_id").eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ itemIds: (data ?? []).map((row: { item_id: string }) => row.item_id) });
}

export async function POST(request: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Favorites service is unavailable" }, { status: 503 });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { itemId?: unknown; favorite?: unknown } | null;
  const itemId = cleanItemId(body?.itemId);
  if (!itemId || typeof body?.favorite !== "boolean") return NextResponse.json({ error: "Invalid favorite request" }, { status: 400 });

  const result = body.favorite
    ? await supabase.from("user_favorites").upsert({ user_id: user.id, item_id: itemId }, { onConflict: "user_id,item_id" })
    : await supabase.from("user_favorites").delete().eq("user_id", user.id).eq("item_id", itemId);

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
