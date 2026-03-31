import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const revalidate = 300;

export async function GET() {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from("items")
    .select(
      "id, title, category, images, image_url, location, location_city, estimated_value, created_at, condition",
    )
    .eq("status", "active")
    .eq("is_active", true)
    .eq("is_demo", false)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
