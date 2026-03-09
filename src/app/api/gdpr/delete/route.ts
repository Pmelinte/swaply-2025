/**
 * POST /api/gdpr/delete
 * Creates a GDPR account-deletion request in `gdpr_requests`.
 * Does NOT delete anything — actual deletion is manual by admin or a separate job.
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

  // Check for existing pending delete request
  const { data: existing } = await sb
    .from("gdpr_requests")
    .select("id, status, requested_at")
    .eq("user_id", userId)
    .eq("type", "delete")
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: "Ai deja o cerere de ștergere în așteptare.",
        requestedAt: existing.requested_at,
      },
      { status: 409 },
    );
  }

  const { error } = await sb.from("gdpr_requests").insert({
    user_id: userId,
    type: "delete",
    status: "pending",
  });

  if (error) {
    console.error("[gdpr/delete] insert error:", error.message);
    return NextResponse.json({ error: "Eroare la înregistrarea cererii" }, { status: 500 });
  }

  // Audit log (fire-and-forget)
  logAction({
    userId,
    action: "gdpr.delete_requested",
    entityType: "gdpr_request",
    request,
  }).catch(() => {});

  return NextResponse.json({
    message: "Cererea a fost înregistrată. Contul va fi șters în maxim 30 de zile.",
  });
}
