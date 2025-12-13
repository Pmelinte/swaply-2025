// src/app/api/wishlist/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { WishlistApiResponse } from "@/features/wishlist/types";

/**
 * GET /api/wishlist
 * Returnează wishlist-ul userului curent
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<WishlistApiResponse>> {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    const { data, error } = await supabase
      .from("wishlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[WISHLIST_API_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_wishlist" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, entries: data ?? [] },
      { status: 200 },
    );
  } catch (err) {
    console.error("[WISHLIST_API_GET_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/wishlist
 * Body: { itemId }
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<WishlistApiResponse>> {
  try {
    const supabase = createServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId;

    if (!itemId || typeof itemId !== "string") {
      return NextResponse.json(
        { ok: false, error: "missing_item_id" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: user.id,
        item_id: itemId,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("[WISHLIST_API_ADD_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_add_wishlist" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, entries: [data] },
      { status: 200 },
    );
  } catch (err) {
    console.error("[WISHLIST_API_POST_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}