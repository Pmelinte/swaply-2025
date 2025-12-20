// src/app/api/categories/tree/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

type CategoryType = "object" | "service" | "home";

type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
};

type CategoryTreeNode = CategoryDto & { children: CategoryTreeNode[] };

type ApiResponse =
  | { ok: true; tree: CategoryTreeNode[] }
  | { ok: false; error: string };

function normalizeType(type: string | null): CategoryType | null {
  if (!type) return null;
  const v = type.toLowerCase();
  if (v === "object" || v === "service" || v === "home") return v;
  return null;
}

function buildTree(flat: CategoryDto[]): CategoryTreeNode[] {
  const byId = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const c of flat) {
    byId.set(c.id, { ...c, children: [] });
  }

  for (const c of flat) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortRec = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    for (const n of nodes) sortRec(n.children);
  };
  sortRec(roots);

  return roots;
}

/**
 * GET /api/categories/tree
 * Optional: ?type=object|service|home
 */
export async function GET(
  req: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createServerClient();
    const { searchParams } = new URL(req.url);

    const typeParam = searchParams.get("type");
    const typeFilter = normalizeType(typeParam);

    let q = supabase
      .from("categories")
      .select("id, name, slug, type, parent_id")
      .order("name", { ascending: true });

    if (typeFilter) q = q.eq("type", typeFilter);

    const { data, error } = await q;

    if (error) {
      console.error("[CATEGORIES_TREE_ERROR]", error);
      return NextResponse.json(
        { ok: false, error: "db_error_fetch_categories" },
        { status: 500 },
      );
    }

    const flat: CategoryDto[] =
      (data ?? []).map((row: any) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        type: row.type,
        parentId: row.parent_id ?? null,
      })) ?? [];

    const tree = buildTree(flat);

    return NextResponse.json({ ok: true, tree }, { status: 200 });
  } catch (err) {
    console.error("[CATEGORIES_TREE_UNEXPECTED]", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 },
    );
  }
}