// src/app/api/items/route.ts

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
  const images = row.images ?? [];
  const primary =
    images.find((i: any) => i.isPrimary) ?? images[0] ?? null;

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
 * GET /api/items
 *
 * Query params (opțional):
 *  - ?category=electronics
 *  - ?subcategory=phones
 *  - ?limit=50
 *
 * MVP:
 *  - public read
 *  - filtrare simplă
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const subcategory = url.searchParams.get("subcategory");
    const limitRaw = url.searchParams.get("limit");

    const limit = Math.max(
      1,
      Math.min(100, Number(limitRaw) || 24),
    );

    let query = supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (category) query = query.eq("category", category);
    if (subcategory) query = query.eq("subcategory", subcategory);

    const { data, error } = await query;

    if (error) {
      console.error("[ITEMS_LIST_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_items" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: true, items: (data ?? []).map(mapRow) },
      { status: 200 },
    );
  } catch (err) {
    console.error("[ITEMS_LIST_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}