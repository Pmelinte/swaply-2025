import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { data: target, error: targetError } = await supabase
    .from("items")
    .select("id,owner_id")
    .eq("id", id)
    .or("category.eq.service,item_type.eq.service")
    .eq("status", "active")
    .eq("is_active", true)
    .maybeSingle();

  if (targetError) {
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }
  if (!target) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }
  if (target.owner_id === auth.user.id) {
    return NextResponse.json(
      { error: "Cannot express interest in your own service" },
      { status: 400 },
    );
  }

  const { data: source, error: sourceError } = await supabase
    .from("items")
    .select("id")
    .eq("owner_id", auth.user.id)
    .or("category.eq.service,item_type.eq.service")
    .eq("status", "active")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sourceError) {
    return NextResponse.json({ error: sourceError.message }, { status: 500 });
  }
  if (!source) {
    return NextResponse.json(
      { error: "Create an active service before proposing a service exchange" },
      { status: 409 },
    );
  }

  const { data, error } = await supabase.rpc("express_matching_interest", {
    p_from_item_id: source.id,
    p_to_item_id: target.id,
    p_match_score: 75,
    p_source: "browsing",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ interest: data }, { status: 201 });
}
