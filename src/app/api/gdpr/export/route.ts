/**
 * POST /api/gdpr/export
 * Creates a GDPR data-export request in `gdpr_requests`.
 * Does NOT export inline — actual export is handled by admin/job.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalid" }, { status: 400 });
  }

  const userId = body.userId as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "userId este obligatoriu" }, { status: 400 });
  }

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
