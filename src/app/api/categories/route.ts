import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CategoryType = "object" | "service" | "home";

type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
};

type CategoriesSuccessResponse = {
  ok: true;
  categories: CategoryDto[];
};

type CategoriesErrorResponse = {
  ok: false;
  error: string;
};

type CategoriesApiResponse = CategoriesSuccessResponse | CategoriesErrorResponse;

/**
 * GET /api/categories
 *
 * Opțional: ?type=object|service|home
 *
 * Exemple:
 *  - /api/categories          -> toate categoriile
 *  - /api/categories?type=object -> doar categoriile pentru obiecte
 *
 * Tabelul folosit: public.categories
 * Coloane: id, name, slug, type, parent_id
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<CategoriesApiResponse>> {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);

    const typeParam = searchParams.get("type");
    const typeFilter = normalizeType(typeParam);

    let query = supabase
      .from("categories")
      .select("id, name, slug, type, parent_id")
      .order("name", { ascending: true });

    if (typeFilter) {
      query = query.eq("type", typeFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[CATEGORIES_API_ERROR]", error);
      return NextResponse.json(
        {
          ok: false,
          error: "db_error_fetch_categories",
        },
        { status: 500 },
      );
    }

    const categories: CategoryDto[] =
      data?.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        type: row.type as CategoryType,
        parentId: (row as any).parent_id ?? null,
      })) ?? [];

    return NextResponse.json(
      {
        ok: true,
        categories,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[CATEGORIES_API_UNEXPECTED_ERROR]", error);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
      },
      { status: 500 },
    );
  }
}

function normalizeType(type: string | null): CategoryType | null {
  if (!type) return null;

  const value = type.toLowerCase();
  if (value === "object" || value === "service" || value === "home") {
    return value;
  }

  return null;
}
