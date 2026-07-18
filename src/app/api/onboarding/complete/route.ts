import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import {
  OnboardingProfileAuthorityError,
  updateOnboardingProfileWithAuthority,
} from "@/lib/profile/onboardingProfileAuthority";

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

  try {
    await updateOnboardingProfileWithAuthority({
      supabase: session,
      userId: user.id,
      payload: {
        onboarding_completed: true,
        onboarding_step: "done",
      },
      idempotencyPrefix: `onboarding-complete-${user.id}`,
    });
  } catch (error) {
    if (error instanceof OnboardingProfileAuthorityError) {
      return NextResponse.json(
        { error: "Unable to complete onboarding", code: error.code },
        { status: error.code === "40001" ? 409 : 500 },
      );
    }
    return NextResponse.json(
      { error: "Unable to complete onboarding" },
      { status: 500 },
    );
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { error: progressError } = await service
    .from("onboarding_progress")
    .update({
      step_profile: true,
      current_step: "first_item",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (progressError) {
    return NextResponse.json(
      { error: "Unable to complete onboarding" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
