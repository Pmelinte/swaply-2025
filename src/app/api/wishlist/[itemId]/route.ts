// src/app/api/wishlist/[itemId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { WishlistApiResponse } from "@/features/wishlist/types";

/**
 * DELETE /api/wishlist/:itemId
 * Elimină un item din wishlist-ul userului curent
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { itemId: string } },
): Promise<NextResponse<WishlistApiResponse>> {
  try {
    const { itemId } = context.params;

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "missing_item_id" },
        { status: 400 },
      );
    }

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

    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    if (error) {
      console.error("[WISHLIST_API_DELETE_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_remove_wishlist" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[WISHLIST_API_DELETE_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}