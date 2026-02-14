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
    return NextResponse.json({
      status: "error",
      message: `HuggingFace AI nu este configurat. key=${hfKey ? "yes" : "no"}, enabled=${hfEnabled}`,
    });
  }

  try {
    // Get image as binary buffer
    let imageBuffer: Buffer;

    if (imageBase64) {
      // Strip data URI prefix if present (e.g. "data:image/jpeg;base64,...")
      const base64Data = imageBase64.includes(",")
        ? imageBase64.split(",")[1]
        : imageBase64;
      imageBuffer = Buffer.from(base64Data, "base64");
    } else if (imageUrl) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) {
        return NextResponse.json({
          status: "error",
          message: "Nu am putut descărca imaginea.",
        });
      }
      imageBuffer = Buffer.from(await imgRes.arrayBuffer());
    } else {
      return NextResponse.json({ status: "error", message: "Lipsă imagine." });
    }

    // Step 1: Image captioning via BLIP (with retry for cold start)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let captionData: any = null;
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const captionRes = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "x-wait-for-model": "true",
          },
          body: new Uint8Array(imageBuffer),
        },
      );

      if (captionRes.ok) {
        captionData = await captionRes.json();
        break;
      }

      const errText = await captionRes.text();
      console.warn(`BLIP attempt ${attempt + 1}/${maxRetries} failed:`, captionRes.status, errText);

      // If model is loading (503), wait and retry
      if (captionRes.status === 503 && attempt < maxRetries - 1) {
        const waitTime = Math.min(5000 * (attempt + 1), 15000);
        await new Promise((r) => setTimeout(r, waitTime));
        continue;
      }

      return NextResponse.json({
        status: "error",
        message: `AI nu a putut analiza imaginea (${captionRes.status}). Încearcă din nou.`,
      });
    }

    if (!captionData) {
      return NextResponse.json({
        status: "error",
        message: "AI nu a răspuns după mai multe încercări.",
      });
    }
    // BLIP returns [{ generated_text: "a bicycle parked on the street" }]
    const caption: string =
      captionData?.[0]?.generated_text ?? captionData?.generated_text ?? "";

    if (!caption) {
      return NextResponse.json({
        status: "error",
        message: "AI nu a returnat nicio descriere.",
      });
    }

    // Step 2: Map caption to category via zero-shot classification
    let category = keywordCategory(caption);

    const catRes = await fetch(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfKey}`,
          "Content-Type": "application/json",
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

    // Step 3: Generate a title from caption
    const title = formatCaptionAsTitle(caption);

    return NextResponse.json({
      status: "ok",
      caption,
      title,
      category,
    });
  } catch (err) {
    console.error("Image AI error:", err);
    return NextResponse.json({
      status: "error",
      message: "Eroare la analiza imaginii.",
    });
  }
}

/** Capitalize first letter and clean up BLIP caption for use as title */
function formatCaptionAsTitle(caption: string): string {
  // Remove common BLIP prefixes like "a ", "an ", "there is a "
  let title = caption.trim();
  title = title.replace(/^(there is |there are |a photo of |an image of |a picture of )/i, "");
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  // Truncate to 120 chars
  if (title.length > 120) {
    title = title.slice(0, 117) + "...";
  }
  return title;
}

/** Keyword-based category fallback */
function keywordCategory(text: string): string {
  const t = text.toLowerCase();
  const mapping: [string, string[]][] = [
    ["Electronică", ["laptop", "computer", "monitor", "phone", "tablet", "console", "keyboard", "mouse", "camera", "tv", "television", "speaker", "headphone", "electronic", "cable", "charger", "printer", "router", "drone"]],
    ["Sport & Outdoor", ["bike", "bicycle", "scooter", "ball", "tennis", "football", "soccer", "basketball", "ski", "surf", "skateboard", "helmet", "camping", "tent", "hiking", "running", "yoga", "gym", "fitness", "sport", "outdoor", "swimming"]],
    ["Hobby & Jocuri", ["lego", "puzzle", "game", "guitar", "piano", "instrument", "chess", "paint", "toy", "doll", "figure", "model", "craft", "music", "art", "card"]],
    ["Cărți & Media", ["book", "novel", "magazine", "vinyl", "record", "dvd", "cd", "manga", "comic", "newspaper", "reading"]],
    ["Casă & Grădină", ["chair", "table", "lamp", "couch", "sofa", "bed", "shelf", "pot", "plant", "garden", "tool", "hammer", "kitchen", "cup", "plate", "vase", "clock", "mirror", "rug", "curtain", "furniture", "vacuum"]],
    ["Modă & Accesorii", ["shirt", "dress", "jacket", "coat", "pants", "jeans", "shoe", "boot", "sneaker", "hat", "bag", "purse", "watch", "sunglasses", "necklace", "ring", "bracelet", "scarf", "glove", "belt", "tie", "fashion", "leather"]],
  ];
  for (const [cat, keywords] of mapping) {
    if (keywords.some((kw) => t.includes(kw))) return cat;
  }
  return "Hobby & Jocuri";
}
