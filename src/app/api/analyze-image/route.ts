import { NextResponse } from "next/server";
import { POST as analyzeImageSecurely } from "../ai/image/route";
import { resolveVisionLocale } from "@/lib/ai/vision-analysis";

/**
 * Backward-compatible wrapper for the object wizard.
 *
 * The object wizard still posts to /api/analyze-image. This wrapper enriches
 * the request with the active route locale and delegates all provider access,
 * validation, SSRF protection and rate limiting to /api/ai/image.
 */
export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => ({}));
  const body = isRecord(rawBody) ? rawBody : {};
  const locale = resolveVisionLocale({
    explicitLocale: body.locale,
    referer: request.headers.get("referer"),
    acceptLanguage: request.headers.get("accept-language"),
  });

  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");
  headers.delete("content-length");

  const delegatedRequest = new Request(
    new URL("/api/ai/image", request.url),
    {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, locale }),
    },
  );

  const response = await analyzeImageSecurely(delegatedRequest);
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
        locale,
        error:
          typeof data.message === "string"
            ? data.message
            : "Image analysis failed",
        error_code:
          typeof data.code === "string" ? data.code : "image_analysis_failed",
      },
      { status: response.status >= 400 ? response.status : 502 },
    );
  }

  const categoryL1 = firstString(data.categoryL1, data.category);
  const categoryL2 = firstString(data.categoryL2);

  return NextResponse.json({
    status: data.status,
    title: firstString(data.title).slice(0, 80),
    description: firstString(data.caption).slice(0, 500),
    category_l1: categoryL1,
    category_l2: categoryL2,
    confidence:
      typeof data.confidence === "number" ? data.confidence : null,
    locale: firstString(data.locale) || locale,
    provider: firstString(data.provider),
    model: firstString(data.model),
    manual_completion_required: data.manualCompletionRequired === true,
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
