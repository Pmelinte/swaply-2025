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
    // Use items owner_id to count unique users (profiles RLS blocks anon)
    supabase
      .from("items")
      .select("owner_id")
      .eq("status", "active"),
    supabase
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    Promise.resolve(
      supabase
        .from("swaps")
        .select("id", { count: "exact", head: true })
        .eq("status", "completed"),
    ).then((res) => {
      if (res.error) return { count: 0, data: null, error: res.error };
      return res;
    }).catch(() => ({ count: 0, data: null, error: null })),
    // Use items location_city for cities (profiles RLS blocks anon)
    supabase
      .from("items")
      .select("location_city")
      .eq("status", "active")
      .not("location_city", "is", null),
  ]);

  const uniqueUsers = new Set(
    (usersRes.data ?? []).map((i) => i.owner_id),
  );

  const uniqueCities = new Set(
    (citiesRes.data ?? []).map((i) => (i.location_city as string).trim().toLowerCase()),
  );

  return NextResponse.json({
    usersCount: uniqueUsers.size,
    objectsCount: objectsRes.count ?? 0,
    swapsCount: swapsRes.count ?? 0,
    citiesCount: uniqueCities.size,
  });
}
