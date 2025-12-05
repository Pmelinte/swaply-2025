import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getCurrentProfileAction,
  updateProfileAction,
} from "@/features/profile/server/profile-actions";

/**
 * GET /api/profile
 * Returnează profilul utilizatorului autentificat.
 */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const profile = await getCurrentProfileAction();
  return NextResponse.json(profile);
}

/**
 * PUT /api/profile
 * Actualizează profilul utilizatorului autentificat.
 */
export async function PUT(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await request.json();

  try {
    const updated = await updateProfileAction(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}
