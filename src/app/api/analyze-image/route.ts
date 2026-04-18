import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const imageUrl = body?.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  // Blob / data URLs only exist in the browser — server can't fetch them
  if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
    return NextResponse.json({ error: "Cannot analyze local preview URLs" }, { status: 400 });
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  // Download the image server-side to bypass CORS restrictions on external URLs
  let dataUrl: string;
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Swaply/1.0)" },
    });
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
    }
    const mimeType =
      imgRes.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    dataUrl = `data:${mimeType};base64,${base64}`;
  } catch {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-vision-latest",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for a peer-to-peer swap marketplace. Analyze the product image and return ONLY a JSON object with these fields:\n- title: max 80 chars, concise product name\n- description: max 500 chars, detailed description mentioning visible condition, brand if visible, key features\n- category_l1: one of exactly these values: Animals & Pet Supplies, Apparel & Accessories, Arts & Entertainment, Baby & Toddler, Business & Industrial, Cameras & Optics, Electronics, Furniture, Hardware, Health & Beauty, Home & Garden, Luggage & Bags, Mature, Media, Office Supplies, Software, Sporting Goods, Toys & Games, Vehicles & Parts\n- category_l2: the most appropriate subcategory name (free text, your best guess)\nNo markdown, no explanation, just the JSON.",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              { type: "text", text: "Analyze this product image for a swap marketplace listing." },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "AI request failed" }, { status: 502 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 502 });
    }

    const parsed = JSON.parse(content);
    return NextResponse.json({
      title: parsed.title ? String(parsed.title).slice(0, 80) : null,
      description: parsed.description ? String(parsed.description).slice(0, 500) : null,
      category_l1: parsed.category_l1 ? String(parsed.category_l1) : null,
      category_l2: parsed.category_l2 ? String(parsed.category_l2) : null,
    });
  } catch (err) {
    console.error("analyze-image error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
