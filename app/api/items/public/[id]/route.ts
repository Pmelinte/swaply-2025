// src/app/api/items/public/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type PublicItemDto = {
  id: string;
  title: string;
  description: string | null;

  category: string | null;
  subcategory: string | null;

  condition: string | null;

  locationCity: string | null;
  locationCountry: string | null;

  approximateValue: number | null;
  currency: string | null;

  images: any[] | null;

  createdAt: string;
};

type ApiResponse =
  | { ok: true; item: PublicItemDto }
  | { ok: false; error: string };

function mapRowToPublicDto(row: any): PublicItemDto {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,

    category: row.category ?? null,
    subcategory: row.subcategory ?? null,

    condition: row.condition ?? null,

    locationCity: row.location_city ?? null,
    locationCountry: row.location_country ?? null,

    approximateValue: row.approximate_value ?? null,
    currency: row.currency ?? null,

    images: Array.isArray(row.images) ? row.images : null,

    createdAt: row.created_at,
  };
}

/**
 * GET /api/items/public/[id]
 *
 * Public read by id.
 * NOTE:
 * - doar item-uri active
 * - RLS decide ce e vizibil
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const itemId = context.params.id;

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: "missing_item_id" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("[ITEM_PUBLIC_GET_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_item" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "item_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, item: mapRowToPublicDto(data) },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ITEM_PUBLIC_GET_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
