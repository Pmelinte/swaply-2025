// src/app/api/items/[id]/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

import {
  getItemAction,
  updateItemAction,
  deleteItemAction,
} from "@/features/items/server/item-actions";

type ApiResponse =
  | { ok: true; item: unknown }
  | { ok: true; deleted: true }
  | { ok: false; error: string };

async function getAuthedContext() {
  const supabase = createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      supabase,
      userId: null as string | null,
      errorResponse: NextResponse.json(
        { ok: false, error: "not_authenticated" },
        { status: 401 }
      ) as NextResponse<ApiResponse>,
    };
  }

  return { supabase, userId: user.id, errorResponse: null as NextResponse<ApiResponse> | null };
}

/**
 * GET /api/items/[id]
 * - returnează item-ul (doar dacă e al userului curent)
 */
export async function GET(
  _request: Request,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const { supabase, userId, errorResponse } = await getAuthedContext();
  if (errorResponse || !userId) return errorResponse!;

  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_item_id" }, { status: 400 });
  }

  try {
    const item = await getItemAction(supabase, id);

    if (!item) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (item.ownerId !== userId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (err: any) {
    console.error("[ITEM_GET_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/items/[id]
 * - update item (doar owner)
 */
export async function PUT(
  request: Request,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const { supabase, userId, errorResponse } = await getAuthedContext();
  if (errorResponse || !userId) return errorResponse!;

  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_item_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  try {
    // Owner check înainte de update (până punem RLS strict)
    const existing = await getItemAction(supabase, id);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (existing.ownerId !== userId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const item = await updateItemAction(supabase, id, body);

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (err: any) {
    console.error("[ITEM_UPDATE_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "validation_error" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/items/[id]
 * - delete item (doar owner)
 */
export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  const { supabase, userId, errorResponse } = await getAuthedContext();
  if (errorResponse || !userId) return errorResponse!;

  const id = context.params.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "missing_item_id" }, { status: 400 });
  }

  try {
    // Owner check înainte de delete (până punem RLS strict)
    const existing = await getItemAction(supabase, id);

    if (!existing) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (existing.ownerId !== userId) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    await deleteItemAction(supabase, id);

    return NextResponse.json({ ok: true, deleted: true }, { status: 200 });
  } catch (err: any) {
    console.error("[ITEM_DELETE_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "internal_error" },
      { status: 500 }
    );
  }
}
