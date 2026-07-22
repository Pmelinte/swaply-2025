import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { isItemLifecycleStatus, itemLifecyclePatch } from "@/lib/items/item-lifecycle";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = typeof body?.status === "string" ? body.status : "";
  if (!isItemLifecycleStatus(status)) {
    return NextResponse.json({ error: "Invalid lifecycle status" }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("items")
    .update(itemLifecyclePatch(status))
    .eq("id", id)
    .eq("owner_id", auth.user.id)
    .select("id, status, is_active, updated_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  return NextResponse.json({ item: data });
}
