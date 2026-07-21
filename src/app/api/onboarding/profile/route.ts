import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  OnboardingProfileAuthorityError,
  updateOnboardingProfileWithAuthority,
} from "@/lib/profile/onboardingProfileAuthority";
import { ONBOARDING_STEPS } from "@/lib/profile/onboardingState";

interface OnboardingProfileRequest {
  payload?: unknown;
  requestId?: unknown;
  currentStep?: unknown;
}

function statusForAuthorityError(error: OnboardingProfileAuthorityError): number {
  if (error.code === "INVALID_ONBOARDING_PAYLOAD"
    || error.code === "UNSUPPORTED_ONBOARDING_FIELD"
    || error.code === "INVALID_IDEMPOTENCY_PREFIX"
    || error.code === "22023") {
    return 400;
  }
  if (error.code === "42501") return 403;
  if (error.code === "40001") return 409;
  return 500;
}

async function authenticatedSession() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

export async function GET() {
  const session = await authenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { data, error } = await session.supabase
    .from("profiles")
    .select("display_name,first_name,avatar_url,date_of_birth,address_country,address_city,languages,swap_geo_range,swap_context,open_to_types,swap_intent,bio,affinity_groups,interests,occupation,onboarding_completed,onboarding_step")
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Unable to load onboarding profile" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}

export async function POST(request: Request) {
  const session = await authenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: OnboardingProfileRequest;
  try {
    body = await request.json() as OnboardingProfileRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.requestId !== "string" || body.requestId.length < 8) {
    return NextResponse.json({ error: "Invalid request identifier" }, { status: 400 });
  }
  if (typeof body.currentStep !== "number" || !Number.isInteger(body.currentStep) || body.currentStep < 1 || body.currentStep > 5) {
    return NextResponse.json({ error: "Invalid onboarding step" }, { status: 400 });
  }
  if (!body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
    return NextResponse.json({ error: "Invalid onboarding payload" }, { status: 400 });
  }

  const nextStep = body.currentStep >= 5 ? "interests" : ONBOARDING_STEPS[body.currentStep];
  const payload = {
    ...(body.payload as Record<string, unknown>),
    onboarding_step: nextStep,
  };

  try {
    const result = await updateOnboardingProfileWithAuthority({
      supabase: session.supabase,
      userId: session.user.id,
      payload,
      idempotencyPrefix: `onboarding-step-${session.user.id}-${body.requestId}`,
    });

    return NextResponse.json({
      ok: true,
      profileRevision: result.profileRevision,
      onboardingStep: nextStep,
    });
  } catch (error) {
    if (error instanceof OnboardingProfileAuthorityError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: statusForAuthorityError(error) },
      );
    }

    return NextResponse.json(
      { error: "Unable to save onboarding profile" },
      { status: 500 },
    );
  }
}
