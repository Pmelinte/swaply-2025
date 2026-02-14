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
    // No HF configured — use URL-based fallback
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback });
  }

  try {
    // Get image as binary buffer
    let imageBuffer: Buffer;

    if (imageBase64) {
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      imageBuffer = Buffer.from(base64Data, "base64");
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        const fallback = fallbackFromUrl(imageUrl);
        return NextResponse.json({ status: "fallback", ...fallback });
      }
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return NextResponse.json({ status: "error", message: "Lipsă imagine." });
    }

    // Try image captioning with multiple API formats and models
    const caption = await tryImageCaptioning(imageBuffer, hfKey);

    if (caption) {
      // AI captioning succeeded — classify caption into category
      let category = keywordCategory(caption);

      try {
        const catRes = await fetch(
          "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfKey}`,
              "Content-Type": "application/json",
              "x-wait-for-model": "true",
            },
            body: JSON.stringify({
              inputs: caption,
              parameters: { candidate_labels: CATEGORIES },
            }),
          },
        );
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.labels?.[0]) {
            category = catData.labels[0];
          }
        }
      } catch {
        // classification failed, keep keyword category
      }

      const title = formatCaptionAsTitle(caption);
      return NextResponse.json({ status: "ok", caption, title, category });
    }

    // All AI models failed — use URL-based fallback
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback });
  } catch (err) {
    console.error("Image AI error:", err);
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback });
  }
}

/** Try multiple HuggingFace endpoints and models for image captioning */
async function tryImageCaptioning(imageBuffer: Buffer, hfKey: string): Promise<string | null> {
  // Models to try, in order of preference
  const models = [
    "nlpconnect/vit-gpt2-image-captioning",
    "Salesforce/blip-image-captioning-base",
    "microsoft/git-base-coco",
  ];

  // API base URLs to try (old + new router format)
  const apiFormats = [
    (model: string) => `https://router.huggingface.co/hf-inference/models/${model}`,
    (model: string) => `https://api-inference.huggingface.co/models/${model}`,
  ];

  for (const model of models) {
    for (const getUrl of apiFormats) {
      const url = getUrl(model);
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const res = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${hfKey}`,
              "x-wait-for-model": "true",
            },
            body: new Uint8Array(imageBuffer),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data?.[0]?.generated_text ?? data?.generated_text;
            if (text) {
              console.log(`Caption success: ${model} via ${url}`);
              return text;
            }
          }

          const status = res.status;
          console.warn(`Caption ${model} (${url}) → ${status}`);

          // 410/404/401 = not available, skip to next
          if (status === 410 || status === 404 || status === 401) break;

          // 503 = loading, retry once after 5s
          if (status === 503 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          break; // other error, try next format/model
        } catch (err) {
          console.warn(`Caption ${model} network error:`, err);
          break;
        }
      }
    }
  }

  return null;
}

/** Fallback: extract hints from image URL or filename */
function fallbackFromUrl(imageUrl?: string): { title: string; category: string; caption: string } {
  if (!imageUrl) {
    return { title: "", category: "", caption: "Completează manual titlul și categoria." };
  }

  // Extract filename from URL
  let filename = "";
  try {
    const urlObj = new URL(imageUrl);
    const parts = urlObj.pathname.split("/");
    filename = decodeURIComponent(parts[parts.length - 1] || "");
  } catch {
    filename = imageUrl.split("/").pop() || "";
  }

  // Clean filename: remove extension, replace dashes/underscores with spaces
  const cleaned = filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\d{3,}\b/g, "") // remove long numbers (dimensions, IDs)
    .replace(/\s+/g, " ")
    .trim();

  const category = keywordCategory(cleaned || imageUrl);
  const title = cleaned
    ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
    : "";

  return {
    title: title.slice(0, 120),
    category,
    caption: cleaned
      ? `Din numele fișierului: "${cleaned}". Poți modifica.`
      : "AI indisponibil. Completează manual.",
  };
}

/** Capitalize first letter and clean up caption for use as title */
function formatCaptionAsTitle(caption: string): string {
  let title = caption.trim();
  title = title.replace(/^(there is |there are |a photo of |an image of |a picture of |arafed )/i, "");
  title = title.charAt(0).toUpperCase() + title.slice(1);
  if (title.length > 120) {
    title = title.slice(0, 117) + "...";
  }
  return title;
}

/** Keyword-based category matching */
function keywordCategory(text: string): string {
  const t = text.toLowerCase();
  const mapping: [string, string[]][] = [
    ["Electronică", ["laptop", "computer", "monitor", "phone", "tablet", "console", "keyboard", "mouse", "camera", "tv", "television", "speaker", "headphone", "electronic", "cable", "charger", "printer", "router", "drone"]],
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
