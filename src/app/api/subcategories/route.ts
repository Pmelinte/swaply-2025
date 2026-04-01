import { NextRequest, NextResponse } from "next/server";
import { getCachedSubcategories } from "@/lib/cache/categories";

/**
 * GET /api/subcategories?category=electronics
 *
 * Returns subcategories for a given category slug.
 * Uses "use cache" under the hood — results are cached for hours.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
  }

  const data = await getCachedSubcategories(category);
  return NextResponse.json({ subcategories: data });
}
