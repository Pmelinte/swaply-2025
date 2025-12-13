// src/app/api/items/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type ItemDto = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;

  category: string | null;
  subcategory: string | null;
  tags: string[] | null;

  condition: string | null;

  locationCity: string | null;
  locationCountry: string | null;

  approximateValue: number | null;
  currency: string | null;

  images: any[] | null;

  status: string | null;

  createdAt: string;
  updatedAt: string | null;
};

type ApiResponse =
  | { ok: true; item: ItemDto }
  | { ok: false; error: string };

function mapRowToDto(row: any): ItemDto {
  return {
    id: row.id,
    ownerId: row.owner_id ?? row.user_id ?? row.ownerId ?? row.userId,

    title: row.title,
    description: row.description ?? null,

    category: row.category ?? null,
    subcategory: row.subcategory ?? null,
    tags: row.tags ?? null,

    condition: row.condition ?? null,

    locationCity: row.location_city ?? row.locationCity ?? null,
    locationCountry: row.location_country ?? row.locationCountry ?? null,

    approximateValue: row.approximate_value ?? row.approximateValue ?? null,
    currency: row.currency ?? null,

    images: row.images ?? null,

    status: row.status ?? null,

    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt ?? null,
  };
}

/**
 * GET /api/items/:id
 * Returnează un item by id (public read).
 *
 * Notes:
 * - Nu cerem auth (MVP). Dacă ai RLS strict pe items, atunci va funcționa doar pentru ce e permis de RLS.
 * - Dacă vrei „public feed”, asigură-te că există policy de SELECT corespunzătoare.
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } },
): Promise<NextResponse<ApiResponse>> {
  try {
    const itemId = context.params.id;

    if (!itemId) {
      return NextResponse.json({ ok: false, error: "missing_item_id" }, { status: 400 });
    }

    const supabase = createServerClient();

    // Încercăm să citim itemul. RLS decide ce e vizibil.
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();

    if (error) {
      console.error("[ITEM_GET_ERROR]", error);
      return NextResponse.json({ ok: false, error: "db_error_fetch_item" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "item_not_found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, item: mapRowToDto(data) }, { status: 200 });
  } catch (err) {
    console.error("[ITEM_GET_UNEXPECTED]", err);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}