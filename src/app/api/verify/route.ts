import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase as createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";

const requestSchema = z.object({
  type: z.enum(["email", "phone", "id_document", "selfie", "address"]),
  metadata: z.record(z.unknown()).default({}),
});

const verifyCodeSchema = z.object({
  type: z.enum(["email", "phone"]),
  code: z.string().length(6),
});

/** POST — request verification or submit document */
export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("verifications")
    .upsert(
      {
        user_id: userId,
        type: parsed.data.type,
        status: "pending",
        metadata: parsed.data.metadata,
      },
      { onConflict: "user_id,type" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ verification: data }, { status: 201 });
}

/** PUT — verify with code */
export async function PUT(req: NextRequest) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = verifyCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Get pending verification
  const { data: verification } = await supabase
    .from("verifications")
    .select("*")
    .eq("user_id", userId)
    .eq("type", parsed.data.type)
    .eq("status", "pending")
    .single();

  if (!verification) {
    return NextResponse.json({ error: "No pending verification" }, { status: 404 });
  }

  const storedCode = (verification.metadata as Record<string, unknown>)?.code;
  if (String(storedCode) !== parsed.data.code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Mark as verified
  const { data, error } = await supabase
    .from("verifications")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
    })
    .eq("id", verification.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update profile verification flags
  const flagColumn =
    parsed.data.type === "email" ? "email_verified" :
    parsed.data.type === "phone" ? "phone_verified" : null;

  if (flagColumn) {
    await supabase
      .from("profiles")
      .update({ [flagColumn]: true })
      .eq("user_id", userId);
  }

  return NextResponse.json({ verification: data });
}

/** GET — get verification status */
export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("verifications")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const count = (data ?? []).filter((v: { status: string }) => v.status === "verified").length;

  return NextResponse.json({
    verifications: data ?? [],
    verifiedCount: count,
  });
}
