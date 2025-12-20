import { NextRequest, NextResponse } from "next/server";
import { authorizeApiRequest } from "@/lib/api/api-client";
import { classifyItemFromImage } from "@/lib/ai/item-classification";

export async function POST(req: NextRequest) {
  const auth = await authorizeApiRequest("public:metadata");
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const imageUrl = body?.imageUrl;

  if (!imageUrl) {
    return NextResponse.json({ ok: false, error: "missing_image_url" }, { status: 400 });
  }

  const suggestion = await classifyItemFromImage(imageUrl);
  if (!suggestion) {
    return NextResponse.json({ ok: false, error: "classification_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, metadata: suggestion });
}
