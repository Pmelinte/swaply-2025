import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const ALLOWED_TAGS = new Set(["categories", "subcategories", "seo_content"]);

/**
 * POST /api/revalidate — purge cached data by tag.
 * Body: { tags: ["subcategories"] }
 */
export async function POST(request: NextRequest) {
  let body: { tags?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tags = (body.tags ?? []).filter((t) => ALLOWED_TAGS.has(t));
  if (tags.length === 0) {
    return NextResponse.json({ error: "No valid tags" }, { status: 400 });
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: tags });
}
