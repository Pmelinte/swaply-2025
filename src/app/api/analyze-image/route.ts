import { NextRequest, NextResponse } from "next/server";

const EMPTY = { title: "", description: "", category_l1: "", category_l2: "" };

const SYSTEM_PROMPT =
  "You are a helpful assistant for a peer-to-peer swap marketplace. Analyze the product image and return ONLY a JSON object with these fields:\n" +
  "- title: max 80 chars, concise product name\n" +
  "- description: max 500 chars, detailed description mentioning visible condition, brand if visible, key features\n" +
  "- category_l1: one of exactly these values: Animals & Pet Supplies, Apparel & Accessories, Arts & Entertainment, Baby & Toddler, Business & Industrial, Cameras & Optics, Electronics, Furniture, Hardware, Health & Beauty, Home & Garden, Luggage & Bags, Mature, Media, Office Supplies, Software, Sporting Goods, Toys & Games, Vehicles & Parts\n" +
  "- category_l2: the most appropriate subcategory name (free text, your best guess)\n" +
  "No markdown, no explanation, just the JSON.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const imageUrl: unknown = body?.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    return NextResponse.json(EMPTY);
  }

  // Blob URLs only exist in the browser session — server cannot access them
  if (imageUrl.startsWith("blob:")) {
    return NextResponse.json(EMPTY);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(EMPTY);
  }

  // Resolve the image as a base64 data URL
  let dataUrl: string;
  if (imageUrl.startsWith("data:")) {
    // Already a base64 data URL from the client (local file upload)
    dataUrl = imageUrl;
  } else {
    // External HTTP URL — download server-side to bypass CORS restrictions
    try {
      const imgRes = await fetch(imageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Swaply/1.0)" },
      });
      if (!imgRes.ok) return NextResponse.json(EMPTY);
      const mimeType =
        imgRes.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg";
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      dataUrl = `data:${mimeType};base64,${base64}`;
    } catch {
      return NextResponse.json(EMPTY);
    }
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              {
                type: "text",
                text: "Analyze this product image for a swap marketplace listing.",
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return NextResponse.json(EMPTY);

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json(EMPTY);

    const parsed = JSON.parse(content);
    return NextResponse.json({
      title: parsed.title ? String(parsed.title).slice(0, 80) : "",
      description: parsed.description ? String(parsed.description).slice(0, 500) : "",
      category_l1: parsed.category_l1 ? String(parsed.category_l1) : "",
      category_l2: parsed.category_l2 ? String(parsed.category_l2) : "",
    });
  } catch (err) {
    console.error("analyze-image error:", err);
    return NextResponse.json(EMPTY);
  }
}
