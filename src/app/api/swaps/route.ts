import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const { data: swaps, error } = await supabase
    .from("swaps")
    .select("*")
    .or(`from_user.eq.${user.id},to_user.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[SWAPS_LIST_ERROR]", error);
    return NextResponse.json({ ok: false, error: "db_error" }, { status: 500 });
  }

  const itemIds = Array.from(
    new Set((swaps ?? []).flatMap((s: any) => [s.from_item, s.to_item]).filter(Boolean)),
  );
  const userIds = Array.from(
    new Set((swaps ?? []).flatMap((s: any) => [s.from_user, s.to_user]).filter(Boolean)),
  );

  const itemsById = new Map<string, any>();
  if (itemIds.length) {
    const { data: items } = await supabase
      .from("items")
      .select("id,title,images,category,subcategory")
      .in("id", itemIds);
    for (const item of items ?? []) {
      itemsById.set(item.id, item);
    }
  }

  const profilesById = new Map<string, any>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id,full_name,username,avatar_url")
      .in("user_id", userIds);
    for (const p of profiles ?? []) {
      profilesById.set(p.user_id, p);
    }
  }

  const response = (swaps ?? []).map((s: any) => {
    const fromProfile = profilesById.get(s.from_user) ?? null;
    const toProfile = profilesById.get(s.to_user) ?? null;
    const otherProfile = s.from_user === user.id ? toProfile : fromProfile;

    return {
      ...s,
      from_item: itemsById.get(s.from_item) ?? null,
      to_item: itemsById.get(s.to_item) ?? null,
      from_profile: fromProfile,
      to_profile: toProfile,
      other_profile: otherProfile,
    };
  });

  return NextResponse.json({ ok: true, swaps: response });
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const fromItemId = body?.from_item_id;
  const toItemId = body?.to_item_id;

  if (!fromItemId || !toItemId) {
    return NextResponse.json({ ok: false, error: "missing_items" }, { status: 400 });
  }

  const { data: fromItem, error: fromErr } = await supabase
    .from("items")
    .select("id,user_id")
    .eq("id", fromItemId)
    .maybeSingle();

  if (fromErr || !fromItem || fromItem.user_id !== user.id) {
    return NextResponse.json({ ok: false, error: "invalid_from_item" }, { status: 400 });
  }

  const { data: toItem, error: toErr } = await supabase
    .from("items")
    .select("id,user_id")
    .eq("id", toItemId)
    .maybeSingle();

  if (toErr || !toItem) {
    return NextResponse.json({ ok: false, error: "invalid_to_item" }, { status: 400 });
  }

  if (toItem.user_id === user.id) {
    return NextResponse.json({ ok: false, error: "cannot_swap_own_item" }, { status: 400 });
  }

  const { data: swap, error } = await supabase
    .from("swaps")
    .insert({
      from_user: user.id,
      to_user: toItem.user_id,
      from_item: fromItem.id,
      to_item: toItem.id,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !swap) {
    console.error("[SWAP_CREATE_ERROR]", error);
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, swap }, { status: 201 });
}
