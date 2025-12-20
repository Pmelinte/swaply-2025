import { NextResponse } from "next/server";
import { requireApiClient } from "@/lib/api/public-api";
import { generateItemTitle } from "@/lib/ai/generate-item-title";
import { generateItemDescription } from "@/lib/ai/generate-item-description";

type RequestBody = {
  imageUrl?: string;
  locale?: string;
  tags?: string[];
  condition?: string;
};

export async function POST(request: Request) {
  const auth = await requireApiClient(request, "image/metadata");
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

  const result = classifyData.result ?? {};
  const title = generateItemTitle({
    primaryLabel: result.mainLabel ?? null,
    locale: body.locale ?? "en",
  });

  const description = generateItemDescription({
    title,
    primaryLabel: result.mainLabel ?? null,
    tags: body.tags ?? [],
    condition: body.condition ?? null,
    locale: body.locale ?? "en",
  });

  return NextResponse.json(
    {
      ok: true,
      title,
      description,
      labels: result.labels ?? [],
    },
    { status: 200 }
  );
}
