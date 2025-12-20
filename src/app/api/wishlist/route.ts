// src/app/api/wishlist/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type {
  WishlistApiResponse,
  AddToWishlistInput,
  WishlistEntry,
} from "@/features/wishlist/types";

/**
 * GET /api/wishlist
 * Returnează wishlist-ul userului curent (preferințe).
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<WishlistApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1) User autentificat
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

    const userId = user.id;

    const { data: rows, error } = await supabase
      .from("wishlist")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[WISHLIST_API_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_wishlist" },
        { status: 500 },
      );
    }

    const entries: WishlistEntry[] =
      (rows ?? []).map((row: any) => ({
        id: row.id as string,
        userId: row.user_id as string,
        category: row.category ?? null,
        subcategory: row.subcategory ?? null,
        brand: row.brand ?? null,
        condition: row.condition ?? null,
        priceMin: row.price_min ?? null,
        priceMax: row.price_max ?? null,
        createdAt: row.created_at as string,
      })) ?? [];

    return NextResponse.json({ ok: true, entries }, { status: 200 });
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
 * Body: { category, subcategory, brand, condition, priceMin, priceMax }
 * Adaugă o preferință în wishlist.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<WishlistApiResponse>> {
  try {
    const supabase = createServerClient();

    // 1) User autentificat
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

    const userId = user.id;

    // 2) Body
    const body = (await req.json().catch(() => ({}))) as Partial<AddToWishlistInput>;

    const { data, error } = await supabase
      .from("wishlist")
      .insert({
        user_id: userId,
        category: body.category ?? null,
        subcategory: body.subcategory ?? null,
        brand: body.brand ?? null,
        condition: body.condition ?? null,
        price_min: body.priceMin ?? null,
        price_max: body.priceMax ?? null,
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

    const entry: WishlistEntry = {
      id: data.id as string,
      userId: data.user_id as string,
      category: data.category ?? null,
      subcategory: data.subcategory ?? null,
      brand: data.brand ?? null,
      condition: data.condition ?? null,
      priceMin: data.price_min ?? null,
      priceMax: data.price_max ?? null,
      createdAt: data.created_at as string,
    };

    return NextResponse.json({ ok: true, entries: [entry] }, { status: 201 });
  } catch (err) {
    console.error("[WISHLIST_API_POST_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
