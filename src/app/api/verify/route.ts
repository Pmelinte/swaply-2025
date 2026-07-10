import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";

const requestSchema = z.object({
  type: z.enum(["email", "phone", "id_document", "selfie", "address"]),
  metadata: z
    .record(z.unknown())
    .default({})
    .refine((value) => JSON.stringify(value).length <= 20_000, {
      message: "Metadata is too large",
    }),
});

async function getCurrentUser() {
  const supabase = await getServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

function sanitizeMetadata(metadata: Record<string, unknown>) {
  const sanitized = { ...metadata };
  for (const key of ["code", "otp", "token", "secret", "password"]) {
    delete sanitized[key];
  }
  return sanitized;
}

/** POST — submit a document-based verification request for the signed-in user. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  if (parsed.data.type === "email" || parsed.data.type === "phone") {
    return NextResponse.json(
      { error: "Email and phone verification must use Supabase Auth." },
      { status: 422 },
    );
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await service
    .from("verifications")
    .upsert(
      {
        user_id: user.id,
        type: parsed.data.type,
        status: "pending",
        metadata: sanitizeMetadata(parsed.data.metadata),
      },
      { onConflict: "user_id,type" },
    )
    .select("id, type, status, created_at, verified_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Verification service is not configured." },
      { status: 503 },
    );
  }

  return NextResponse.json({ verification: data }, { status: 201 });
}

/**
 * Verification codes are handled by Supabase Auth.
 * Keeping this explicit response prevents the legacy caller-controlled code flow.
 */
export async function PUT() {
  return NextResponse.json(
    { error: "Legacy code verification has been disabled." },
    { status: 410 },
  );
}

/** GET — return only the signed-in user's verification status. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const { data, error } = await service
    .from("verifications")
    .select("id, type, status, created_at, verified_at")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Verification service is not configured." },
      { status: 503 },
    );
  }

  const verifications = data ?? [];
  return NextResponse.json({
    verifications,
    verifiedCount: verifications.filter(
      (verification: { status: string }) => verification.status === "verified",
    ).length,
  });
}
