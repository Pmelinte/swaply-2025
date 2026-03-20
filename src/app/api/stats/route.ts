import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const revalidate = 60;

export async function GET() {
  const supabase = await getServerSupabase();

  if (!supabase) {
    return NextResponse.json(
      { usersCount: 0, objectsCount: 0, swapsCount: 0, citiesCount: 0 },
      { status: 200 },
    );
  }

  const [usersRes, objectsRes, swapsRes, citiesRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id", { count: "exact", head: true }),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("swaps")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("profiles")
      .select("location_text")
      .not("location_text", "is", null),
  ]);

  const uniqueCities = new Set(
    (citiesRes.data ?? []).map((p) => (p.location_text as string).trim().toLowerCase()),
  );

  return NextResponse.json({
    usersCount: usersRes.count ?? 0,
    objectsCount: objectsRes.count ?? 0,
    swapsCount: swapsRes.count ?? 0,
    citiesCount: uniqueCities.size,
  });
}
