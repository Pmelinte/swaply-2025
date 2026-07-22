/**
 * GET /api/gdpr/export returns the authenticated owner's data as JSON.
 * POST /api/gdpr/export creates a GDPR data-export request in `gdpr_requests`.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit";
import { validateCsrf } from "@/lib/csrf";

async function getAuthenticatedUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return { error: NextResponse.json({ error: "Serviciu indisponibil" }, { status: 503 }) };

  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: NextResponse.json({ error: "Autentificare necesară" }, { status: 401 }) };

  return { supabase, authUser };
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser();
  if (auth.error) return auth.error;

  const userId = auth.authUser.id;
  const sb = getServiceSupabase();
  if (!sb) return NextResponse.json({ error: "Serviciu indisponibil" }, { status: 503 });

  const [profile, items, notifications, swaps, gdprRequests] = await Promise.all([
    sb.from("profiles").select("*").or(`id.eq.${userId},user_id.eq.${userId}`).limit(1),
    sb.from("items").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
    sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("swap_intents").select("*").or(`requester_id.eq.${userId},responder_id.eq.${userId}`).order("created_at", { ascending: false }),
    sb.from("gdpr_requests").select("id,type,status,requested_at,completed_at").eq("user_id", userId).order("requested_at", { ascending: false }),
  ]);

  const errors = [profile.error, items.error, notifications.error, swaps.error, gdprRequests.error].filter(Boolean);
  if (errors.length > 0) {
    console.error("[gdpr/export] read error:", errors.map((e) => e?.message).join("; "));
    return NextResponse.json({ error: "Eroare la pregătirea exportului" }, { status: 500 });
  }

  logAction({ userId, action: "gdpr.export_downloaded", entityType: "profile", request }).catch(() => {});

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile.data?.[0] ?? null,
    items: items.data ?? [],
    notifications: notifications.data ?? [],
    swaps: swaps.data ?? [],
    gdprRequests: gdprRequests.data ?? [],
  });
}


export async function POST(request: NextRequest) {
  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Token CSRF invalid" }, { status: 403 });
  }

  const auth = await getAuthenticatedUser();
  if (auth.error) return auth.error;

  // Use the authenticated user's ID — ignore any userId from the body
  const userId = auth.authUser.id;

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Serviciu indisponibil" }, { status: 503 });
  }

  // Check for existing pending export request
  const { data: existing } = await sb
    .from("gdpr_requests")
    .select("id, status, requested_at")
    .eq("user_id", userId)
    .eq("type", "export")
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: "Ai deja o cerere de export în așteptare.",
        requestedAt: existing.requested_at,
      },
      { status: 409 },
    );
  }

  const { error } = await sb.from("gdpr_requests").insert({
    user_id: userId,
    type: "export",
    status: "pending",
  });

  if (error) {
    console.error("[gdpr/export] insert error:", error.message);
    return NextResponse.json({ error: "Eroare la înregistrarea cererii" }, { status: 500 });
  }

  // Audit log (fire-and-forget)
  logAction({
    userId,
    action: "gdpr.export_requested",
    entityType: "gdpr_request",
    request,
  }).catch(() => {});

  return NextResponse.json({
    message: "Cererea a fost înregistrată. Vei primi un email în 48h.",
  });
}
