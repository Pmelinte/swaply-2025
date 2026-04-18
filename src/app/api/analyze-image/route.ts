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
  // --- Stage 1: parse body ---
  const body = await req.json().catch((e: unknown) => {
    console.error("[analyze-image] body parse failed:", e);
    return null;
  });
  const imageUrl: unknown = body?.imageUrl;
  if (!imageUrl || typeof imageUrl !== "string") {
    console.error("[analyze-image] missing/invalid imageUrl, body keys:", body ? Object.keys(body) : "null");
    return NextResponse.json({ ...EMPTY, _debug: "missing imageUrl" });
  }

  const urlType = imageUrl.startsWith("data:") ? "data" : imageUrl.startsWith("blob:") ? "blob" : "http";
  const payloadKB = Math.round(imageUrl.length / 1024);
  console.log(`[analyze-image] imageUrl type=${urlType} size=${payloadKB}KB`);

  if (imageUrl.startsWith("blob:")) {
    console.error("[analyze-image] blob: URLs cannot be fetched server-side");
    return NextResponse.json({ ...EMPTY, _debug: "blob url not supported" });
  }

  // --- Stage 2: API key check ---
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[analyze-image] GROQ_API_KEY is not set");
    return NextResponse.json({ ...EMPTY, _debug: "no api key" });
  }
  console.log("[analyze-image] GROQ_API_KEY present, length:", apiKey.length);

  // --- Stage 3: resolve image to base64 ---
  let dataUrl: string;
  if (imageUrl.startsWith("data:")) {
    dataUrl = imageUrl;
    console.log(`[analyze-image] using existing data URL, size=${Math.round(dataUrl.length / 1024)}KB`);
  } else {
    console.log("[analyze-image] fetching external URL:", imageUrl.slice(0, 100));
    try {
      const imgRes = await fetch(imageUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Swaply/1.0)" },
      });
      if (!imgRes.ok) {
        console.error("[analyze-image] external fetch failed:", imgRes.status, imgRes.statusText);
        return NextResponse.json({ ...EMPTY, _debug: `fetch failed ${imgRes.status}` });
      }
      const mimeType =
        imgRes.headers.get("content-type")?.split(";")[0].trim() || "image/jpeg";
      const buffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      dataUrl = `data:${mimeType};base64,${base64}`;
      console.log(`[analyze-image] external image fetched, mime=${mimeType} size=${Math.round(dataUrl.length / 1024)}KB`);
    } catch (e) {
      console.error("[analyze-image] external fetch exception:", e);
      return NextResponse.json({ ...EMPTY, _debug: "fetch exception" });
    }
  }

  // --- Stage 4: call Groq ---
  console.log("[analyze-image] calling Groq API...");
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

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error(`[analyze-image] Groq API error ${res.status}:`, errText.slice(0, 500));
      return NextResponse.json({ ...EMPTY, _debug: `groq ${res.status}: ${errText.slice(0, 200)}` });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    console.log("[analyze-image] Groq raw content:", content?.slice(0, 300));

    if (!content) {
      console.error("[analyze-image] Groq returned empty content, full response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ ...EMPTY, _debug: "empty groq content" });
    }

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("[analyze-image] parsed result:", JSON.stringify(parsed).slice(0, 200));

    return NextResponse.json({
      title: parsed.title ? String(parsed.title).slice(0, 80) : "",
      description: parsed.description ? String(parsed.description).slice(0, 500) : "",
      category_l1: parsed.category_l1 ? String(parsed.category_l1) : "",
      category_l2: parsed.category_l2 ? String(parsed.category_l2) : "",
      _debug: "ok",
    });
  } catch (err) {
    console.error("[analyze-image] exception:", err);
    return NextResponse.json({ ...EMPTY, _debug: `exception: ${String(err).slice(0, 200)}` });
  }
}
