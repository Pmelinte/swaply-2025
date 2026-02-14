import { NextResponse } from "next/server";

const CATEGORIES = [
  "Electronică",
  "Sport & Outdoor",
  "Hobby & Jocuri",
  "Cărți & Media",
  "Casă & Grădină",
  "Modă & Accesorii",
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { imageUrl, imageBase64 } = body as {
    imageUrl?: string;
    imageBase64?: string;
  };

  if (!imageUrl && !imageBase64) {
    return NextResponse.json({
      status: "error",
      message: "Trimite imageUrl sau imageBase64",
    });
  }

  try {
    // Get image as raw base64 (without data URI prefix) and mime type
    let base64Data: string;
    let mimeType: string;

    if (imageBase64) {
      if (imageBase64.includes(",")) {
        const [header, data] = imageBase64.split(",");
        base64Data = data;
        mimeType = header.match(/data:([^;]+)/)?.[1] || "image/jpeg";
      } else {
        base64Data = imageBase64;
        mimeType = "image/jpeg";
      }
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        const fallback = fallbackFromUrl(imageUrl);
        return NextResponse.json({ status: "fallback", ...fallback });
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      base64Data = buffer.toString("base64");
      mimeType = imgRes.headers.get("content-type") || "image/jpeg";
    } else {
      return NextResponse.json({ status: "error", message: "Lipsă imagine." });
    }

    // Try Gemini first (free, reliable), then HuggingFace as fallback
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const result = await analyzeWithGemini(base64Data, mimeType, geminiKey);
      if (result) {
        return NextResponse.json({ status: "ok", ...result });
      }
    }

    // Fallback to HuggingFace vision models
    const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
    const hfEnabled = process.env.NEXT_PUBLIC_HF_ENABLED === "true";
    if (hfKey && hfEnabled) {
      const dataUri = `data:${mimeType};base64,${base64Data}`;
      const result = await analyzeWithHuggingFace(dataUri, hfKey);
      if (result) {
        return NextResponse.json({ status: "ok", ...result });
      }
    }

    // All AI failed — use URL-based fallback
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback });
  } catch (err) {
    console.error("Image AI error:", err);
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback });
  }
}

/** Analyze image with Google Gemini (free: 15 req/min) */
async function analyzeWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
): Promise<{ caption: string; title: string; category: string } | null> {
  const categoriesList = CATEGORIES.join(", ");

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Look at this image of an item for a swap/barter platform. Respond with ONLY a JSON object (no markdown, no code blocks):
{"description": "short description of the item (3-8 words, English)", "category": "EXACTLY one of: ${categoriesList}"}`,
                },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      console.warn("Gemini API error:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    console.log("Gemini response:", text);

    if (!text) return null;
    return parseAiResponse(text);
  } catch (err) {
    console.warn("Gemini error:", err);
    return null;
  }
}

/** Fallback: analyze image with HuggingFace vision models */
async function analyzeWithHuggingFace(
  imageDataUri: string,
  hfKey: string,
): Promise<{ caption: string; title: string; category: string } | null> {
  const categoriesList = CATEGORIES.join(", ");
  const prompt = `Look at this image and respond with ONLY a JSON object: {"description": "short item description", "category": "one of: ${categoriesList}"}`;

  const attempts = [
    { url: "https://router.huggingface.co/together/v1/chat/completions", model: "meta-llama/Llama-Vision-Free" },
    { url: "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions", model: "meta-llama/Llama-3.2-11B-Vision-Instruct" },
  ];

  for (const { url, model } of attempts) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: [
            { type: "image_url", image_url: { url: imageDataUri } },
            { type: "text", text: prompt },
          ]}],
          max_tokens: 200,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return parseAiResponse(text);
      }
      console.warn(`HF Vision ${model} → ${res.status}`);
    } catch (err) {
      console.warn(`HF Vision ${model} error:`, err);
    }
  }

  return null;
}

/** Parse AI response (JSON or plain text) into title + category */
function parseAiResponse(text: string): { caption: string; title: string; category: string } | null {
  try {
    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const description = parsed.description || parsed.desc || text;
      let category = parsed.category || "";

      if (!CATEGORIES.includes(category)) {
        category = keywordCategory(description);
      }

      return {
        caption: description,
        title: formatTitle(description),
        category,
      };
    }
  } catch {
    // JSON parse failed
  }

  // Treat as plain text description
  return {
    caption: text,
    title: formatTitle(text),
    category: keywordCategory(text),
  };
}

/** Fallback: extract hints from image URL or filename */
function fallbackFromUrl(imageUrl?: string): { title: string; category: string; caption: string } {
  if (!imageUrl) {
    return { title: "", category: "", caption: "Completează manual titlul și categoria." };
  }

  let filename = "";
  try {
    const urlObj = new URL(imageUrl);
    filename = decodeURIComponent(urlObj.pathname.split("/").pop() || "");
  } catch {
    filename = imageUrl.split("/").pop() || "";
  }

  const cleaned = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\d{3,}\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const category = keywordCategory(cleaned || imageUrl);
  const title = cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";

  return {
    title: title.slice(0, 120),
    category,
    caption: cleaned
      ? `Din numele fișierului: "${cleaned}". Poți modifica.`
      : "AI indisponibil. Completează manual.",
  };
}

function formatTitle(caption: string): string {
  let title = caption.trim();
  title = title.replace(/^(there is |there are |a photo of |an image of |a picture of |arafed |this is |the image shows |an? )/i, "");
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > 120) title = title.slice(0, 117) + "...";
  return title;
}

function keywordCategory(text: string): string {
  const t = text.toLowerCase();
  const mapping: [string, string[]][] = [
    ["Electronică", ["laptop", "computer", "monitor", "phone", "tablet", "console", "keyboard", "mouse", "camera", "tv", "television", "speaker", "headphone", "electronic", "cable", "charger", "printer", "router", "drone", "display", "screen"]],
    ["Sport & Outdoor", ["bike", "bicycle", "scooter", "ball", "tennis", "football", "soccer", "basketball", "ski", "surf", "skateboard", "helmet", "camping", "tent", "hiking", "running", "yoga", "gym", "fitness", "sport", "outdoor", "swimming"]],
    ["Hobby & Jocuri", ["lego", "puzzle", "game", "guitar", "piano", "instrument", "chess", "paint", "toy", "doll", "figure", "model", "craft", "music", "art", "card"]],
    ["Cărți & Media", ["book", "novel", "magazine", "vinyl", "record", "dvd", "cd", "manga", "comic", "newspaper", "reading"]],
    ["Casă & Grădină", ["chair", "table", "lamp", "couch", "sofa", "bed", "shelf", "pot", "plant", "garden", "tool", "hammer", "kitchen", "cup", "plate", "vase", "clock", "mirror", "rug", "curtain", "furniture", "vacuum", "recliner", "desk"]],
    ["Modă & Accesorii", ["shirt", "dress", "jacket", "coat", "pants", "jeans", "shoe", "boot", "sneaker", "hat", "bag", "purse", "watch", "sunglasses", "necklace", "ring", "bracelet", "scarf", "glove", "belt", "tie", "fashion", "leather"]],
  ];
  for (const [cat, keywords] of mapping) {
    if (keywords.some((kw) => t.includes(kw))) return cat;
  }
  return "";
}
