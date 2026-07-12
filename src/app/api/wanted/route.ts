/**
 * /api/wanted
 * GET: public active/non-expired requests, or all own requests with mine=true.
 * POST: authenticated creation with offered-item ownership validation.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getClient(request: NextRequest): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const authHeader = request.headers.get("authorization");
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: authHeader ? { headers: { Authorization: authHeader } } : undefined,
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

function normalizeItemIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 20);
}

function mapRequest(row: Record<string, unknown>) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    category: row.category,
    city: row.city,
    offerDescription: row.offer_description,
    offerItemIds: row.offer_item_ids ?? [],
    status: row.status,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const db = getClient(request);
  if (!db) {
    return NextResponse.json({ code: "SERVER_MISCONFIGURED" }, { status: 500 });
  }

  const mine = request.nextUrl.searchParams.get("mine") === "true";
  const category = cleanText(request.nextUrl.searchParams.get("category"), 100);
  const city = cleanText(request.nextUrl.searchParams.get("city"), 120);

  let currentUserId: string | null = null;
  if (mine) {
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }
    currentUserId = authData.user.id;
  }

  let query = db.from("wanted_requests").select("*");

  if (mine && currentUserId) {
    query = query.eq("user_id", currentUserId);
  } else {
    query = query.eq("status", "active").gt("expires_at", new Date().toISOString());
  }
  if (category) query = query.eq("category", category);
  if (city) query = query.eq("city", city);

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ code: "WANTED_LIST_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ requests: (data ?? []).map(mapRequest) });
}

export async function POST(request: NextRequest) {
  const db = getClient(request);
  if (!db) {
    return NextResponse.json({ code: "SERVER_MISCONFIGURED" }, { status: 500 });
  }

  const { data: authData, error: authError } = await db.auth.getUser();
  const user = authData.user;
  if (authError || !user) {
    return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
  }

  const title = cleanText(rawBody.title, 160);
  if (!title || title.length < 3) {
    return NextResponse.json({ code: "INVALID_TITLE" }, { status: 400 });
  }

  const offerItemIds = normalizeItemIds(rawBody.offerItemIds);
  if (offerItemIds.length > 0) {
    const { data: ownedItems, error: ownershipError } = await db
      .from("items")
      .select("id")
      .eq("owner_id", user.id)
      .in("id", offerItemIds);

    if (ownershipError) {
      return NextResponse.json({ code: "OFFER_ITEMS_VALIDATION_FAILED" }, { status: 500 });
    }

    const ownedIds = new Set((ownedItems ?? []).map((item: { id: string }) => item.id));
    if (offerItemIds.some((id) => !ownedIds.has(id))) {
      return NextResponse.json({ code: "OFFER_ITEM_NOT_OWNED" }, { status: 403 });
    }
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const payload = {
    user_id: user.id,
    title,
    description: cleanText(rawBody.description, 2000),
    category: cleanText(rawBody.category, 100),
    city: cleanText(rawBody.city, 120),
    offer_description: cleanText(rawBody.offerDescription, 1000),
    offer_item_ids: offerItemIds,
    status: "active",
    expires_at: expiresAt,
  };

  const { data: wantedRequest, error: insertError } = await db
    .from("wanted_requests")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !wantedRequest) {
    return NextResponse.json({ code: "WANTED_CREATE_FAILED" }, { status: 500 });
  }

  let matchQuery = db
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .eq("is_active", true)
    .neq("owner_id", user.id);

  if (payload.category) matchQuery = matchQuery.eq("category", payload.category);
  const { count } = await matchQuery;

  return NextResponse.json(
    {
      request: mapRequest(wantedRequest),
      matchedCount: count ?? 0,
    },
    { status: 201 },
  );
}
