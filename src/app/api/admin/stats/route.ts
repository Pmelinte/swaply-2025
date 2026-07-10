import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function GET() {
  const session = await getServerSupabase();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: userRole } = await session
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (userRole?.role !== "admin" && userRole?.role !== "moderator") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const [users, items, swaps, reports] = await Promise.all([
    service
      .from("profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("is_banned", false),
    service
      .from("items")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("is_active", true),
    service
      .from("swaps")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "accepted"]),
    service
      .from("abuse_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const error = users.error ?? items.error ?? swaps.error ?? reports.error;
  if (error) {
    return NextResponse.json({ error: "Unable to load statistics" }, { status: 500 });
  }

  return NextResponse.json({
    totalUsers: users.count ?? 0,
    activeItems: items.count ?? 0,
    activeSwaps: swaps.count ?? 0,
    openReports: reports.count ?? 0,
  });
}
