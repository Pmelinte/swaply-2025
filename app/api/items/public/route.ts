// src/app/api/items/public/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type ItemPreviewDto = {
  id: string;
  title: string;
  primaryImageUrl: string | null;
  category: string | null;
  subcategory: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  createdAt: string;
};

type ApiResponse =
  | { ok: true; items: ItemPreviewDto[] }
  | { ok: false; error: string };

function mapRow(row: any): ItemPreviewDto {
  const images = Array.isArray(row.images) ? row.images : [];
  const primary =
    images.find((i: any) => i?.isPrimary) ?? images[0] ?? null;

  return {
    id: row.id,
    title: row.title,
    primaryImageUrl: primary?.url ?? null,
    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
    locationCity: row.location_city ?? null,
    locationCountry: row.location_country ?? null,
    createdAt: row.created_at,
  };
}

/**
 * GET /api/items/public
 *
 * Query params (opțional):
 *  - ?q=iphone
 *  - ?category=electronics
 *  - ?subcategory=phones
 *  - ?condition=good
 *  - ?location=bucuresti
 *  - ?limit=50
 *
 * MVP:
 *  - public read
 *  - doar item-uri active
 */
export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const subcategory = url.searchParams.get("subcategory");
    const limitRaw = url.searchParams.get("limit");
    const search = url.searchParams.get("q");
    const condition = url.searchParams.get("condition");
    const location = url.searchParams.get("location");

    const limit = Math.max(1, Math.min(100, Number(limitRaw) || 24));

    let dbQuery = supabase
      .from("items")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) dbQuery = dbQuery.eq("category", category);
    if (subcategory) dbQuery = dbQuery.eq("subcategory", subcategory);
    if (condition) dbQuery = dbQuery.eq("condition", condition);

    if (search) {
      const safeQuery = search.replace(/%/g, "");
      dbQuery = dbQuery.or(
        `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%`
      );
    }

    if (location) {
      const safeLocation = location.replace(/%/g, "");
      dbQuery = dbQuery.or(
        `location_city.ilike.%${safeLocation}%,location_country.ilike.%${safeLocation}%`
      );
    }

    const { data, error } = await dbQuery;

    if (error) {
      console.error("[ITEMS_PUBLIC_LIST_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_items" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, items: (data ?? []).map(mapRow) },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ITEMS_PUBLIC_LIST_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
