/**
 * POST /api/gdpr/export
 * Creates a GDPR data-export request in `gdpr_requests`.
 * Does NOT export inline — actual export is handled by admin/job.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit";
import { validateCsrf } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: "Token CSRF invalid" }, { status: 403 });
  }

  // Authenticate the user via session cookie
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Serviciu indisponibil" }, { status: 503 });
  }
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Autentificare necesară" }, { status: 401 });
  }

  // Use the authenticated user's ID — ignore any userId from the body
  const userId = authUser.id;

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
