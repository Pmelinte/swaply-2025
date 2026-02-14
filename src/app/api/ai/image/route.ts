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

  const hfKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
  const hfEnabled = process.env.NEXT_PUBLIC_HF_ENABLED === "true";

  if (!hfKey || !hfEnabled) {
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback });
  }

  try {
    // Build base64 data URI for the vision model
    let imageDataUri: string;

    if (imageBase64) {
      // Already has data URI prefix or raw base64
      imageDataUri = imageBase64.includes("data:")
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;
    } else if (imageUrl) {
      // Fetch image and convert to base64
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        const fallback = fallbackFromUrl(imageUrl);
        return NextResponse.json({ status: "fallback", ...fallback });
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      imageDataUri = `data:${contentType};base64,${buffer.toString("base64")}`;
    } else {
      return NextResponse.json({ status: "error", message: "Lipsă imagine." });
    }

    // Use vision-language model via chat completions API
    const result = await analyzeWithVisionModel(imageDataUri, hfKey);

    if (result) {
      return NextResponse.json({ status: "ok", ...result });
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

/** Use a vision-language model via HuggingFace chat completions */
async function analyzeWithVisionModel(
  imageDataUri: string,
  hfKey: string,
): Promise<{ caption: string; title: string; category: string } | null> {
  const categoriesList = CATEGORIES.join(", ");
  const prompt = `Look at this image and respond with ONLY a JSON object (no other text):
{"description": "short description of the item in English", "category": "one of: ${categoriesList}"}`;

  // Try different providers and models — Together AI offers free Llama Vision
  const attempts = [
    // Together AI provider via HF Router (free Llama Vision)
    {
      url: "https://router.huggingface.co/together/v1/chat/completions",
      model: "meta-llama/Llama-Vision-Free",
    },
    {
      url: "https://router.huggingface.co/together/v1/chat/completions",
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
    },
    // Novita AI provider via HF Router
    {
      url: "https://router.huggingface.co/novita/v1/chat/completions",
      model: "meta-llama/llama-3.2-11b-vision-instruct",
    },
    // HF Inference direct
    {
      url: "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions",
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
    },
    {
      url: "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions",
      model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
    },
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
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imageDataUri } },
                { type: "text", text: prompt },
              ],
            },
          ],
          max_tokens: 200,
        }),
      });

      const status = res.status;
      if (!res.ok) {
        console.warn(`Vision ${model} (${url}) → ${status}`);
        // Skip to next on definitive errors
        if (status === 410 || status === 404 || status === 422 || status === 401 || status === 403) continue;
        // Wait on 503 then continue
        if (status === 503) {
          await new Promise((r) => setTimeout(r, 3000));
        }
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      console.log(`Vision success: ${model} (${url}):`, text);

      if (text) {
        return parseVisionResponse(text);
      }
    } catch (err) {
      console.warn(`Vision ${model} error:`, err);
    }
  }

  // Fallback: try legacy image-to-text models
  return tryLegacyCaptioning(imageDataUri, hfKey);
}

/** Try legacy image-to-text pipeline (pre-2025 HF API) */
async function tryLegacyCaptioning(
  imageDataUri: string,
  hfKey: string,
): Promise<{ caption: string; title: string; category: string } | null> {
  const base64Data = imageDataUri.split(",")[1];
  if (!base64Data) return null;
  const imageBuffer = Buffer.from(base64Data, "base64");

  const models = [
    "nlpconnect/vit-gpt2-image-captioning",
    "Salesforce/blip-image-captioning-base",
  ];

  const urls = [
    (m: string) => `https://router.huggingface.co/hf-inference/models/${m}`,
    (m: string) => `https://api-inference.huggingface.co/models/${m}`,
  ];

  for (const model of models) {
    for (const getUrl of urls) {
      try {
        const res = await fetch(getUrl(model), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "x-wait-for-model": "true",
          },
          body: new Uint8Array(imageBuffer),
        });

        if (res.ok) {
          const data = await res.json();
          const caption = data?.[0]?.generated_text ?? data?.generated_text;
          if (caption) {
            console.log(`Legacy caption success: ${model}`);
            return {
              caption,
              title: formatCaptionAsTitle(caption),
              category: keywordCategory(caption),
            };
          }
        }

        const status = res.status;
        if (status === 410 || status === 404) break;
      } catch {
        // continue to next
      }
    }
  }

  return null;
}

/** Parse JSON response from vision model */
function parseVisionResponse(text: string): { caption: string; title: string; category: string } | null {
  try {
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Not JSON — treat whole text as description
      return {
        caption: text,
        title: formatCaptionAsTitle(text),
        category: keywordCategory(text),
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const description = parsed.description || parsed.desc || text;
    let category = parsed.category || "";

    // Validate category is one of ours
    if (!CATEGORIES.includes(category)) {
      category = keywordCategory(description);
    }

    return {
      caption: description,
      title: formatCaptionAsTitle(description),
      category,
    };
  } catch {
    // JSON parse failed — use text as-is
    return {
      caption: text,
      title: formatCaptionAsTitle(text),
      category: keywordCategory(text),
    };
  }
}

/** Fallback: extract hints from image URL or filename */
function fallbackFromUrl(imageUrl?: string): { title: string; category: string; caption: string } {
  if (!imageUrl) {
    return { title: "", category: "", caption: "Completează manual titlul și categoria." };
  }

  let filename = "";
  try {
    const urlObj = new URL(imageUrl);
    const parts = urlObj.pathname.split("/");
    filename = decodeURIComponent(parts[parts.length - 1] || "");
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

function formatCaptionAsTitle(caption: string): string {
  let title = caption.trim();
  title = title.replace(/^(there is |there are |a photo of |an image of |a picture of |arafed |this is |the image shows )/i, "");
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > 120) {
    title = title.slice(0, 117) + "...";
  }
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
