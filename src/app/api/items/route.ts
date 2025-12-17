// src/app/api/items/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

import {
  createItemAction,
  listMyItemsAction,
} from "@/features/items/server/item-actions";

type ApiResponse =
  | { ok: true; items: unknown[] }
  | { ok: true; item: unknown }
  | { ok: false; error: string };

/**
 * GET /api/items
 * - listează item-urile userului curent (owner view)
 *
 * Query params (opțional):
 *  - ?limit=30
 *  - ?offset=0
 *  - ?onlyActive=true
 */
export async function GET(request: Request): Promise<NextResponse<ApiResponse>> {
  const supabase = createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);

  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 30)));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
  const onlyActive = searchParams.get("onlyActive") === "true";

  try {
    const items = await listMyItemsAction(supabase, user.id, {
      limit,
      offset,
      onlyActive,
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (err: any) {
    console.error("[ITEMS_MY_LIST_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/items
 * - creează un item pentru userul curent
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse>> {
  const supabase = createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json" },
      { status: 400 }
    );
  }

  try {
    const item = await createItemAction(supabase, user.id, body);
    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err: any) {
    console.error("[ITEMS_CREATE_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "validation_error" },
      { status: 400 }
    );
  }
}
