import { NextResponse } from "next/server";

const CATEGORIES = [
  "Electronică",
  "Sport & Outdoor",
  "Hobby & Jocuri",
  "Cărți & Media",
  "Casă & Grădină",
  "Modă & Accesorii",
];

const TAG_CANDIDATES = [
  "tech", "gaming", "audio", "video", "laptop", "phone", "tablet", "monitor",
  "sport", "outdoor", "camping", "hiking", "fitness", "bike", "running",
  "lego", "puzzle", "boardgame", "music", "guitar", "art", "drone",
  "books", "manga", "vinyl", "dvd", "cooking", "education",
  "garden", "tools", "home", "kitchen", "lamp", "decor", "furniture",
  "fashion", "leather", "watch", "sunglasses", "bag", "shoes", "accessories",
  "vintage", "handmade", "eco", "portable", "wireless", "retro",
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { title, description, action } = body as {
    title?: string;
    description?: string;
    action?: "classify" | "tags" | "both";
  };

  const text = [title, description].filter(Boolean).join(". ");
  if (!text) {
    return NextResponse.json({ status: "error", message: "Titlu sau descriere lipsa" });
  }

  const hfKey = process.env.HUGGINGFACE_API_KEY;
  const hfEnabled = process.env.NEXT_PUBLIC_HF_ENABLED === "true";

  // Fallback: keyword-based matching when HF is not available
  if (!hfKey || !hfEnabled) {
    return NextResponse.json({
      status: "fallback",
      category: keywordCategory(text),
      tags: keywordTags(text),
    });
  }

  const effectiveAction = action || "both";

  try {
    const results: { category?: string; tags?: string[] } = {};

    // Category classification via zero-shot
    if (effectiveAction === "classify" || effectiveAction === "both") {
      const catRes = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            parameters: { candidate_labels: CATEGORIES },
          }),
        },
      );
      if (catRes.ok) {
        const catData = await catRes.json();
        results.category = catData.labels?.[0] ?? keywordCategory(text);
      } else {
        results.category = keywordCategory(text);
      }
    }

    // Tag suggestion via zero-shot on tag candidates
    if (effectiveAction === "tags" || effectiveAction === "both") {
      const tagRes = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: text,
            parameters: {
              candidate_labels: TAG_CANDIDATES,
              multi_label: true,
            },
          }),
        },
      );
      if (tagRes.ok) {
        const tagData = await tagRes.json();
        // Take top 5 tags with score > 0.15
        const labels: string[] = tagData.labels ?? [];
        const scores: number[] = tagData.scores ?? [];
        results.tags = labels
          .filter((_, i) => scores[i] > 0.15)
          .slice(0, 5);
        if (results.tags.length === 0) {
          results.tags = keywordTags(text);
        }
      } else {
        results.tags = keywordTags(text);
      }
    }

    return NextResponse.json({ status: "ok", ...results });
  } catch {
    return NextResponse.json({
      status: "fallback",
      category: keywordCategory(text),
      tags: keywordTags(text),
    });
  }
}

/** Simple keyword-based category matching as fallback */
function keywordCategory(text: string): string {
  const t = text.toLowerCase();
  const mapping: [string, string[]][] = [
    ["Electronică", ["laptop", "monitor", "keyboard", "phone", "tablet", "console", "gaming", "ssd", "headphone", "webcam", "speaker", "watch", "bluetooth", "usb", "electronic", "tech", "raspberry", "drone"]],
    ["Sport & Outdoor", ["bike", "scooter", "camping", "tent", "hiking", "sport", "football", "tennis", "yoga", "running", "skateboard", "surf", "backpack", "outdoor", "fitness"]],
    ["Hobby & Jocuri", ["lego", "puzzle", "paint", "guitar", "chess", "boardgame", "catan", "telescope", "hobby", "music", "instrument", "art", "game"]],
    ["Cărți & Media", ["book", "harry potter", "python", "vinyl", "manga", "dvd", "cookbook", "programming", "collection", "record"]],
    ["Casă & Grădină", ["garden", "lamp", "vacuum", "pot", "hammock", "coffee", "kitchen", "tool", "home", "decor", "furniture"]],
    ["Modă & Accesorii", ["leather", "sunglasses", "watch", "jacket", "bag", "tote", "fashion", "shoes", "accessories"]],
  ];
  for (const [cat, keywords] of mapping) {
    if (keywords.some((kw) => t.includes(kw))) return cat;
  }
  return "Hobby & Jocuri"; // default fallback
}

/** Simple keyword-based tag extraction */
function keywordTags(text: string): string[] {
  const t = text.toLowerCase();
  return TAG_CANDIDATES.filter((tag) => t.includes(tag)).slice(0, 5);
}
