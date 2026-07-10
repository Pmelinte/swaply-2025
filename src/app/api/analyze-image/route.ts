import { NextResponse } from "next/server";
import { POST as analyzeImageSecurely } from "../ai/image/route";

/**
 * Backward-compatible wrapper for the object wizard.
 *
 * The legacy implementation fetched arbitrary URLs and exposed provider debug
 * details. All analysis now goes through the authenticated, validated and
 * rate-limited /api/ai/image implementation.
 */
export async function POST(request: Request) {
  const response = await analyzeImageSecurely(request);
  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok || data.status === "error") {
    return NextResponse.json(
      {
        title: "",
        description: "",
        category_l1: "",
        category_l2: "",
        error: typeof data.message === "string" ? data.message : "Image analysis failed",
      },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  return NextResponse.json({
    title: typeof data.title === "string" ? data.title.slice(0, 80) : "",
    description:
      typeof data.caption === "string" ? data.caption.slice(0, 500) : "",
    category_l1:
      typeof data.category === "string" ? data.category : "",
    category_l2: "",
  });
}
