// src/app/api/wishlist/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type {
  WishlistApiResponse,
  AddToWishlistInput,
  WishlistEntry,
  WishlistItemPreview,
} from "@/features/wishlist/types";

/**
 * GET /api/wishlist
 * Returnează wishlist-ul userului curent în format "preview"
 * (titlu + imagine principală), bun pentru UI.
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

    // 2) Luăm wishlists + join items (FK: wishlists.item_id -> items.id)
    const { data: rows, error } = await supabase
      .from("wishlists")
      .select(
        `
        id,
        user_id,
        item_id,
        created_at,
        items:items (
          id,
          title,
          images
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[WISHLIST_API_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_wishlist" },
        { status: 500 },
      );
    }

    const items: WishlistItemPreview[] =
      (rows ?? []).map((row: any) => {
        const item = row.items ?? null;

        let primaryImageUrl: string | null = null;
        const images = item?.images;

        // images e de obicei JSON array: [{ url, isPrimary, ...}, ...]
        if (Array.isArray(images) && images.length > 0) {
          const primary = images.find((img: any) => img?.isPrimary) ?? images[0];
          primaryImageUrl = primary?.url ?? null;
        }

        return {
          id: row.id as string,
          itemId: row.item_id as string,
          title: (item?.title as string) ?? null,
          primaryImageUrl,
          createdAt: row.created_at as string,
        };
      }) ?? [];

    return NextResponse.json({ ok: true, items }, { status: 200 });
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
 * Body: { itemId: string }
 * Adaugă un item în wishlist.
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
    const itemId = (body.itemId ?? "").trim();

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "missing_item_id" },
        { status: 400 },
      );
    }

    // 3) Insert (ideal ai unique(user_id, item_id) în DB ca să prevină duplicate)
    const { data, error } = await supabase
      .from("wishlists")
      .insert({
        user_id: userId,
        item_id: itemId,
      })
      .select("id, user_id, item_id, created_at")
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
      itemId: data.item_id as string,
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