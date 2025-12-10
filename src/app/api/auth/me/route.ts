// src/app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Returnează user-ul curent (doar id + email)
 * GET /api/auth/me
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { ok: false, user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("[AUTH_ME_ERROR]", err);
    return NextResponse.json({ ok: false, user: null }, { status: 200 });
  }
}