import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const ALLOWED_STATUSES = new Set(["active", "fulfilled", "cancelled"]);

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

function cleanText(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
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

async function requireUser(request: NextRequest) {
  const db = getClient(request);
  if (!db) return { error: NextResponse.json({ code: "SERVER_MISCONFIGURED" }, { status: 500 }) };

  const { data, error } = await db.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 }) };
  }

  return { db, user: data.user };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const db = getClient(request);
  if (!db) return NextResponse.json({ code: "SERVER_MISCONFIGURED" }, { status: 500 });

  const { id } = await context.params;
  const { data, error } = await db
    .from("wanted_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ code: "WANTED_READ_FAILED" }, { status: 500 });
  if (!data) return NextResponse.json({ code: "WANTED_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ request: mapRequest(data) });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { db, user } = auth;
  const { id } = await context.params;

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ code: "INVALID_JSON" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const title = cleanText(rawBody.title, 160);
  if (title !== undefined) {
    if (!title || title.length < 3) return NextResponse.json({ code: "INVALID_TITLE" }, { status: 400 });
    update.title = title;
  }

  const description = cleanText(rawBody.description, 2000);
  const category = cleanText(rawBody.category, 100);
  const city = cleanText(rawBody.city, 120);
  const offerDescription = cleanText(rawBody.offerDescription, 1000);
  if (description !== undefined) update.description = description;
  if (category !== undefined) update.category = category;
  if (city !== undefined) update.city = city;
  if (offerDescription !== undefined) update.offer_description = offerDescription;

  if (rawBody.status !== undefined) {
    if (typeof rawBody.status !== "string" || !ALLOWED_STATUSES.has(rawBody.status)) {
      return NextResponse.json({ code: "INVALID_STATUS" }, { status: 400 });
    }
    update.status = rawBody.status;
    if (rawBody.status === "active") {
      update.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  const { data, error } = await db
    .from("wanted_requests")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ code: "WANTED_UPDATE_FAILED" }, { status: 500 });
  if (!data) return NextResponse.json({ code: "WANTED_NOT_FOUND_OR_FORBIDDEN" }, { status: 404 });
  return NextResponse.json({ request: mapRequest(data) });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { db, user } = auth;
  const { id } = await context.params;

  const { data, error } = await db
    .from("wanted_requests")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json({ code: "WANTED_DELETE_FAILED" }, { status: 500 });
  if (!data) return NextResponse.json({ code: "WANTED_NOT_FOUND_OR_FORBIDDEN" }, { status: 404 });
  return NextResponse.json({ deletedId: data.id });
}
