import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/features/profile/server/ensure-profile";
import { updateProfileAction } from "@/features/profile/server/profile-actions";

export async function GET() {
  try {
    const supabase = createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    }

    const profile = await ensureProfileForUser(user.id, {
      suggestedUsername: user.email?.split("@")[0],
    });

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const updated = await updateProfileAction(body ?? {});

    return NextResponse.json({ ok: true, profile: updated });
  } catch (error: any) {
    console.error("[PROFILE_UPDATE_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: error?.message ?? "update_failed" },
      { status: 400 },
    );
  }
}
