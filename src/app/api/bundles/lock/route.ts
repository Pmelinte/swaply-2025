/**
 * POST /api/bundles/lock — Lock all bundles for a swap (called on acceptance)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;

  let body: { swapId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { swapId } = body;
  if (!swapId) return NextResponse.json({ error: "swapId required" }, { status: 400 });

  // Verify participant
  const { data: swap } = await db
    .from("swaps")
    .select("id, requester_id, responder_id")
    .eq("id", swapId)
    .maybeSingle();

  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });
  if (swap.requester_id !== user.id && swap.responder_id !== user.id) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Lock all bundles
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("swap_bundles")
    .update({ locked: true, locked_at: now })
    .eq("swap_id", swapId)
    .eq("locked", false)
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log audit event
  if (data && data.length > 0) {
    await db.from("swap_events").insert({
      swap_id: swapId,
      actor_id: user.id,
      action: "bundle_locked",
      metadata: { bundleCount: data.length, lockedAt: now },
    }).then(({ error: logErr }) => {
      if (logErr) console.error("[bundles/lock] event log error:", logErr.message);
    });
  }

  return NextResponse.json({ locked: data?.length ?? 0 });
}
