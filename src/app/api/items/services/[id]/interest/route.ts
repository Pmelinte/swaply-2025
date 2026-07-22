import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { data: target, error: targetError } = await supabase
    .from("items")
    .select("id,owner_id")
    .eq("id", id)
    .or("category.eq.service,item_type.eq.service")
    .eq("status", "active")
    .eq("is_active", true)
    .maybeSingle();
  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "Service not found" }, { status: 404 });
  if (target.owner_id === auth.user.id) return NextResponse.json({ error: "Cannot express interest in your own service" }, { status: 400 });

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
  if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 500 });
  if (!source) return NextResponse.json({ error: "Create an active service before proposing a service exchange" }, { status: 409 });

  const { data: existing } = await supabase
    .from("matching_interests")
    .select("id,status")
    .eq("from_user_id", auth.user.id)
    .eq("to_user_id", target.owner_id)
    .eq("from_item_id", source.id)
    .eq("to_item_id", target.id)
    .eq("status", "pending")
    .maybeSingle();
  if (existing) return NextResponse.json({ interest: existing });

  const { data, error } = await supabase
    .from("matching_interests")
    .insert({
      from_user_id: auth.user.id,
      to_user_id: target.owner_id,
      from_item_id: source.id,
      to_item_id: target.id,
      source: "browsing",
      status: "pending",
      match_score: 75,
    })
    .select("id,status")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ interest: data }, { status: 201 });
}
