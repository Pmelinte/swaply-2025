import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getCurrentProfileAction,
  updateProfileAction,
} from "../../../src/features/profile/server/profile-actions";

/**
 * GET /api/profile
 * Returnează profilul utilizatorului autentificat.
 */
export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await getCurrentProfileAction();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

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
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = await updateProfileAction(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update profile" },
      { status: 400 }
    );
  }
}

// Compat: POST se comportă ca PUT.
export async function POST(request: Request) {
  return PUT(request);
}
