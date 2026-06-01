/**
 * POST /api/bundles — Create or update a bundle for a swap
 * GET  /api/bundles?swap_id=xxx — Get bundles for a swap
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getClients(token: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const db = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;
  return { userClient, db };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const swapId = request.nextUrl.searchParams.get("swap_id");
  if (!swapId) return NextResponse.json({ error: "swap_id required" }, { status: 400 });

  const { data, error } = await db
    .from("swap_bundles")
    .select("*")
    .eq("swap_id", swapId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bundles: data });
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { userClient, db } = clients;
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    swapId?: string;
    side?: "requester" | "responder";
    itemIds?: string[];
    notes?: string;
    totalEstimatedValue?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { swapId, side, itemIds, notes, totalEstimatedValue } = body;
  if (!swapId || !side || !itemIds || itemIds.length === 0) {
    return NextResponse.json({ error: "swapId, side, and itemIds are required" }, { status: 400 });
  }

  // Verify swap exists and user is participant
  const { data: swap } = await db
    .from("swaps")
    .select("id, requester_id, responder_id, status")
    .eq("id", swapId)
    .maybeSingle();

  if (!swap) return NextResponse.json({ error: "Swap not found" }, { status: 404 });

  const isRequester = swap.requester_id === user.id;
  const isResponder = swap.responder_id === user.id;
  if (!isRequester && !isResponder) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  // Check existing locked bundle
  const { data: existing } = await db
    .from("swap_bundles")
    .select("id, locked")
    .eq("swap_id", swapId)
    .eq("side", side)
    .maybeSingle();

  if (existing?.locked) {
    return NextResponse.json({ error: "Bundle is locked and cannot be modified" }, { status: 422 });
  }

  // Upsert
  if (existing) {
    const { data, error } = await db
      .from("swap_bundles")
      .update({
        item_ids: itemIds,
        notes: notes ?? "",
        total_estimated_value: totalEstimatedValue ?? null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bundle: data });
  }

  const { data, error } = await db
    .from("swap_bundles")
    .insert({
      swap_id: swapId,
      side,
      item_ids: itemIds,
      notes: notes ?? "",
      total_estimated_value: totalEstimatedValue ?? null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bundle: data }, { status: 201 });
}
