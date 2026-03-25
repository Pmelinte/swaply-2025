import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";

/**
 * POST /api/dmca/report
 * Receives a DMCA takedown request and stores it in the database.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { fullName, email, infringingUrl, originalWorkDescription, originalWorkUrl, perjuryDeclaration, ownerDeclaration } = body as Record<string, unknown>;

  if (!fullName || !email || !infringingUrl || !originalWorkDescription || !perjuryDeclaration || !ownerDeclaration) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Store in notifications table as a high-priority admin notification
  if (supabase) {
    await supabase.from("notifications").insert({
      user_id: "system",
      type: "dmca_report",
      title: `DMCA Report from ${fullName}`,
      message: `Infringing URL: ${infringingUrl}\nOriginal work: ${originalWorkDescription}\nOriginal URL: ${originalWorkUrl || "N/A"}\nContact: ${email}`,
      priority: "urgent",
      read: false,
    }).then(({ error }) => {
      if (error) console.error("[DMCA] Failed to store report:", error.message);
    });
  }

  return NextResponse.json({ success: true });
}
