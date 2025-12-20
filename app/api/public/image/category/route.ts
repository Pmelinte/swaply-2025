import { NextResponse } from "next/server";
import { requireApiClient } from "@/lib/api/public-api";
import { mapAiLabelsToCategory } from "@/lib/categories/ai-label-mapper";

type RequestBody = {
  imageUrl?: string;
  locale?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiClient(request, "image/category");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  if (!body.imageUrl) {
    return NextResponse.json({ ok: false, error: "missing_image_url" }, { status: 400 });
  }

  const classifyRes = await fetch(new URL("/api/ai/items/classify", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: body.imageUrl, locale: body.locale ?? "en" }),
  });

  const classifyData = await classifyRes.json().catch(() => ({}));

  if (!classifyRes.ok || !classifyData.ok) {
    return NextResponse.json(
      { ok: false, error: classifyData?.error ?? "classification_failed" },
      { status: 502 }
    );
  }

  const result = classifyData.result ?? classifyData.data ?? {};
  const labels = Array.isArray(result.labels) ? result.labels : [];
  const mapping = mapAiLabelsToCategory({
    mainLabel: result.mainLabel ?? null,
    labels: labels.map((label: any) => ({
      label: label.label,
      confidence: label.confidence ?? label.score ?? null,
    })),
    locale: body.locale ?? "en",
    raw: result.raw ?? result,
  });

  return NextResponse.json(
    {
      ok: true,
      category: mapping.categorySlug ?? null,
      subcategory: mapping.subcategorySlug ?? null,
      labels,
    },
    { status: 200 }
  );
}
