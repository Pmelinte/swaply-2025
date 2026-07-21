import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import {
  OnboardingProfileAuthorityError,
  updateOnboardingProfileWithAuthority,
} from "@/lib/profile/onboardingProfileAuthority";
import {
  isAtLeastSixteen,
  validateRequiredOnboardingProfile,
  type OnboardingProfileState,
} from "@/lib/profile/onboardingState";

export async function POST() {
  const session = await getServerSupabase();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: { user } } = await session.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await session
    .from("profiles")
    .select("display_name,date_of_birth,address_country,languages,onboarding_completed")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Unable to validate onboarding profile" }, { status: 500 });
  }

  if (profile.onboarding_completed) {
    return NextResponse.json({ ok: true, alreadyCompleted: true });
  }

  const missing = validateRequiredOnboardingProfile(profile as OnboardingProfileState);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Required onboarding data is incomplete", missing },
      { status: 400 },
    );
  }

  if (!isAtLeastSixteen(String(profile.date_of_birth))) {
    return NextResponse.json({ error: "User must be at least 16 years old" }, { status: 400 });
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
    return NextResponse.json({ error: "Unable to complete onboarding" }, { status: 500 });
  }

  const service = getServiceSupabase();
  if (service) {
    await service
      .from("onboarding_progress")
      .update({
        step_profile: true,
        current_step: "first_item",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}
