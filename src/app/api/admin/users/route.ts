import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSupabase } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_badge"),
    userId: z.string().uuid(),
    badge: z.enum(["free", "gold", "premium", "platinum"]),
  }),
  z.object({
    action: z.literal("suspend"),
    userId: z.string().uuid(),
    days: z.number().int().min(1).max(365),
    reason: z.string().trim().min(3).max(500),
  }),
  z.object({
    action: z.literal("ban"),
    userId: z.string().uuid(),
    reason: z.string().trim().min(3).max(500),
  }),
  z.object({
    action: z.literal("unban"),
    userId: z.string().uuid(),
  }),
]);

async function requirePrivilegedUser() {
  const session = await getServerSupabase();
  if (!session) return null;

  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return null;

  const { data: userRole } = await session
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (userRole?.role !== "admin" && userRole?.role !== "moderator") {
    return null;
  }

  return user;
}

export async function GET(request: NextRequest) {
  const actor = await requirePrivilegedUser();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const rawQuery = new URL(request.url).searchParams.get("q") ?? "";
  const query = rawQuery
    .replace(/[^\p{L}\p{N}@._ -]/gu, "")
    .trim()
    .slice(0, 100);

  if (query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const { data, error } = await service
    .from("profiles")
    .select(
      "user_id, username, email, display_name, avatar_url, badge, is_banned, is_suspended, suspended_until, rating, rating_count, created_at, stats",
    )
    .or(
      `email.ilike.%${query}%,username.ilike.%${query}%,display_name.ilike.%${query}%`,
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to search users" }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const actor = await requirePrivilegedUser();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = actionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const service = getServiceSupabase();
  if (!service) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const input = parsed.data;
  let update: Record<string, unknown>;
  let moderationAction: string;
  let reason = "Administrative action";

  switch (input.action) {
    case "set_badge":
      update = { badge: input.badge };
      moderationAction = "set_badge";
      reason = `Badge changed to ${input.badge}`;
      break;
    case "suspend":
      update = {
        is_suspended: true,
        suspended_until: new Date(
          Date.now() + input.days * 24 * 60 * 60 * 1000,
        ).toISOString(),
        suspension_reason: input.reason,
      };
      moderationAction = "suspend";
      reason = input.reason;
      break;
    case "ban":
      update = {
        is_banned: true,
        ban_reason: input.reason,
      };
      moderationAction = "ban";
      reason = input.reason;
      break;
    case "unban":
      update = {
        is_banned: false,
        ban_reason: null,
        is_suspended: false,
        suspended_until: null,
        suspension_reason: null,
      };
      moderationAction = "unban";
      break;
  }

  const { error } = await service
    .from("profiles")
    .update(update)
    .eq("user_id", input.userId);

  if (error) {
    return NextResponse.json({ error: "Unable to update user" }, { status: 500 });
  }

  await service.from("moderation_actions").insert({
    moderator_id: actor.id,
    target_type: "user",
    target_id: input.userId,
    action: moderationAction,
    reason,
  });

  return NextResponse.json({ ok: true });
}
