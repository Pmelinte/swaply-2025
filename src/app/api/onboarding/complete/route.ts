import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function POST() {
  const session = await getServerSupabase();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error: profileError } = await service
    .from("profiles")
    .update({
      onboarding_completed: true,
      onboarding_step: "done",
    })
    .eq("user_id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "Unable to complete onboarding" },
      { status: 500 },
    );
  }

  await service
    .from("onboarding_progress")
    .update({
      step_profile: true,
      current_step: "first_item",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
