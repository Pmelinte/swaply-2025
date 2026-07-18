import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import {
  OnboardingProfileAuthorityError,
  updateOnboardingProfileWithAuthority,
} from "@/lib/profile/onboardingProfileAuthority";

interface OnboardingProfileRequest {
  payload?: unknown;
  requestId?: unknown;
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

export async function POST(request: Request) {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
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

  try {
    const result = await updateOnboardingProfileWithAuthority({
      supabase,
      userId: user.id,
      payload: body.payload,
      idempotencyPrefix: `onboarding-step-${user.id}-${body.requestId}`,
    });

    return NextResponse.json({
      ok: true,
      profileRevision: result.profileRevision,
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
