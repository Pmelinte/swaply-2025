/**
 * /api/wanted — Wanted requests CRUD + matching notifications
 * GET: list active wanted requests (optionally filtered)
 * POST: create a wanted request + check for matching items
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

function normalizeText(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const clients = getClients(token);
  if (!clients) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const { db } = clients;

  const category = request.nextUrl.searchParams.get("category");
  const city = request.nextUrl.searchParams.get("city");
  const userId = request.nextUrl.searchParams.get("user_id");
  const includeExpired = request.nextUrl.searchParams.get("include_expired");

  let query = db.from("wanted_requests").select("*");

  if (!includeExpired) {
    query = query.eq("status", "active");
  }
  if (category) {
    query = query.eq("category", category);
  }
  if (city) {
    query = query.eq("city", city);
  }
  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch user display names
  const userIds = [...new Set((data ?? []).map((r: { user_id: string }) => r.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await db.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] };

  const nameMap = new Map<string, string>();
  for (const p of profiles ?? []) {
    nameMap.set(p.id, p.display_name || "User");
  }

  const requests = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id,
    userId: r.user_id,
    userName: nameMap.get(r.user_id as string) ?? "User",
    title: r.title,
    description: r.description,
    category: r.category,
    city: r.city,
    offerDescription: r.offer_description,
    offerItemIds: r.offer_item_ids,
    status: r.status,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  }));

  return NextResponse.json({ requests });
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
    title?: string;
    description?: string;
    category?: string;
    city?: string;
    offerDescription?: string;
    offerItemIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title || body.title.trim().length < 3) {
    return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 });
  }

  // Insert request
  const { data: wantedReq, error: insertError } = await db
    .from("wanted_requests")
    .insert({
      user_id: user.id,
      title: body.title.trim(),
      description: body.description?.trim() || null,
      category: body.category?.trim() || null,
      city: body.city?.trim() || null,
      offer_description: body.offerDescription?.trim() || null,
      offer_item_ids: body.offerItemIds ?? null,
      status: "active",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (insertError || !wantedReq) {
    return NextResponse.json({ error: insertError?.message ?? "Failed to create" }, { status: 500 });
  }

  // ── Match against existing items ──
  // Find items whose category or title match the wanted request
  const matchedOwners = new Set<string>();
  if (body.category || body.title) {
    const normalizedTitle = normalizeText(body.title);
    const normalizedCategory = body.category ? normalizeText(body.category) : null;

    // Search for matching items
    let matchQuery = db
      .from("objects")
      .select("id, owner_id, title, category")
      .eq("status", "active")
      .neq("owner_id", user.id)
      .limit(50);

    if (normalizedCategory) {
      matchQuery = matchQuery.ilike("category", `%${escapeLike(body.category!)}%`);
    }

    const { data: matchingItems } = await matchQuery;

    for (const item of matchingItems ?? []) {
      const itemTitle = normalizeText(item.title ?? "");
      const itemCategory = normalizeText(item.category ?? "");

      const titleMatch = normalizedTitle.split(" ").some(
        (word: string) => word.length > 2 && (itemTitle.includes(word) || itemCategory.includes(word)),
      );
      const categoryMatch = normalizedCategory && itemCategory.includes(normalizedCategory);

      if (titleMatch || categoryMatch) {
        matchedOwners.add(item.owner_id);
      }
    }

    // Notify matched item owners
    for (const ownerId of matchedOwners) {
      await db.from("notifications").insert({
        user_id: ownerId,
        type: "wanted_match",
        title: "Someone is looking for your item!",
        message: `A new request matches your listing: "${body.title}"`,
        read: false,
      }).then(({ error: e }) => {
        if (e) console.error("[wanted] notification error:", e.message);
      });
    }
  }

  // Also notify the requester if there are existing matching items
  if (matchedOwners.size > 0) {
    await db.from("notifications").insert({
      user_id: user.id,
      type: "wanted_matches_found",
      title: "Matches found for your request!",
      message: `We found ${matchedOwners.size} potential match${matchedOwners.size > 1 ? "es" : ""} for "${body.title}"`,
      read: false,
    }).then(({ error: e }) => {
      if (e) console.error("[wanted] self-notification error:", e.message);
    });
  }

  return NextResponse.json({
    request: {
      id: wantedReq.id,
      userId: wantedReq.user_id,
      title: wantedReq.title,
      description: wantedReq.description,
      category: wantedReq.category,
      city: wantedReq.city,
      offerDescription: wantedReq.offer_description,
      offerItemIds: wantedReq.offer_item_ids,
      status: wantedReq.status,
      expiresAt: wantedReq.expires_at,
      createdAt: wantedReq.created_at,
    },
    matchedCount: matchedOwners.size,
  }, { status: 201 });
}
