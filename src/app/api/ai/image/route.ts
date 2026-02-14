import { NextResponse } from "next/server";
import { CATEGORIES_TAXONOMY } from "@/lib/categories";

/** All category names (top-level + subcategories) for AI matching */
const ALL_CATEGORY_NAMES = CATEGORIES_TAXONOMY.map((c) => c.name);

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

  const attempted: string[] = [];

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
      try {
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
        if (!imgRes.ok) {
          attempted.push(`fetch-url: HTTP ${imgRes.status}`);
          const fallback = fallbackFromUrl(imageUrl);
          return NextResponse.json({ status: "fallback", ...fallback, attempted });
        }
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        base64Data = buffer.toString("base64");
        mimeType = imgRes.headers.get("content-type") || "image/jpeg";
      } catch (fetchErr) {
        attempted.push(`fetch-url: ${String(fetchErr).slice(0, 100)}`);
        const fallback = fallbackFromUrl(imageUrl);
        return NextResponse.json({ status: "fallback", ...fallback, attempted });
      }
    } else {
      return NextResponse.json({ status: "error", message: "Lipsă imagine." });
    }

    const dataUri = `data:${mimeType};base64,${base64Data}`;

    // 1. Try Groq first (free, fast, no regional restrictions)
    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    if (groqKey) {
      const result = await analyzeWithGroq(dataUri, groqKey);
      if (result.ok) {
        return NextResponse.json({ status: "ok", ...result.data, attempted: [...attempted, "groq: ok"] });
      }
      attempted.push(`groq: ${result.error}`);
    } else {
      attempted.push("groq: no API key");
    }

    // 2. Fallback to Gemini
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (geminiKey) {
      let result = await analyzeWithGemini(base64Data, mimeType, geminiKey);
      if (!result.ok && result.error.includes("429")) {
        await new Promise((r) => setTimeout(r, 3000));
        result = await analyzeWithGemini(base64Data, mimeType, geminiKey);
      }
      if (result.ok) {
        return NextResponse.json({ status: "ok", ...result.data, attempted: [...attempted, "gemini: ok"] });
      }
      attempted.push(`gemini: ${result.error}`);
    } else {
      attempted.push("gemini: no key");
    }

    // 3. Fallback to HuggingFace
    const hfKey = (process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN || "").trim();
    const hfEnabled = process.env.NEXT_PUBLIC_HF_ENABLED === "true";
    if (hfKey && hfEnabled) {
      const result = await analyzeWithHuggingFace(dataUri, hfKey);
      if (result.ok) {
        return NextResponse.json({ status: "ok", ...result.data, attempted: [...attempted, "hf: ok"] });
      }
      attempted.push(`hf: ${result.error}`);
    } else {
      attempted.push(`hf: ${!hfKey ? "no key" : "disabled"}`);
    }

    // All AI failed
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback, attempted });
  } catch (err) {
    console.error("Image AI error:", err);
    attempted.push(`exception: ${String(err).slice(0, 100)}`);
    const fallback = fallbackFromUrl(imageUrl);
    return NextResponse.json({ status: "fallback", ...fallback, attempted });
  }
}

type AiResult =
  | { ok: true; data: { caption: string; title: string; category: string } }
  | { ok: false; error: string };

/** Analyze image with Groq (free: 30 req/min, Llama 3.2 Vision 90B) */
async function analyzeWithGroq(
  imageDataUri: string,
  apiKey: string,
): Promise<AiResult> {
  const categoriesList = ALL_CATEGORY_NAMES.join(", ");

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageDataUri },
              },
              {
                type: "text",
                text: `Analyze this image of an item for a swap/barter platform. Respond with ONLY a JSON object (no markdown, no code blocks):
{"description": "short description in Romanian (3-8 words)", "category": "EXACTLY one of: ${categoriesList}"}

Pick the most specific matching category.`,
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 150)}` };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) return { ok: false, error: "empty response" };

    const parsed = parseAiResponse(text);
    if (parsed) return { ok: true, data: parsed };
    return { ok: false, error: `parse failed: ${text.slice(0, 100)}` };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 150) };
  }
}

/** Analyze image with Google Gemini */
async function analyzeWithGemini(
  base64Data: string,
  mimeType: string,
  apiKey: string,
): Promise<AiResult> {
  const categoriesList = ALL_CATEGORY_NAMES.join(", ");

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
                  text: `Analyze this image of an item for a swap/barter platform. Respond with ONLY a JSON object (no markdown, no code blocks):
{"description": "short description in Romanian (3-8 words)", "category": "EXACTLY one of: ${categoriesList}"}

Pick the most specific matching category.`,
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
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!text) {
      const blockReason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason || "no text";
      return { ok: false, error: `empty: ${blockReason}` };
    }

    const parsed = parseAiResponse(text);
    if (parsed) return { ok: true, data: parsed };
    return { ok: false, error: `parse failed: ${text.slice(0, 100)}` };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 150) };
  }
}

/** Fallback: analyze image with HuggingFace vision models */
async function analyzeWithHuggingFace(
  imageDataUri: string,
  hfKey: string,
): Promise<AiResult> {
  const categoriesList = ALL_CATEGORY_NAMES.join(", ");
  const prompt = `Analyze this image and respond with ONLY a JSON object: {"description": "short item description in Romanian", "category": "one of: ${categoriesList}"}`;

  const models = [
    { url: "https://router.huggingface.co/together/v1/chat/completions", model: "meta-llama/Llama-Vision-Free" },
    { url: "https://router.huggingface.co/hf-inference/models/meta-llama/Llama-3.2-11B-Vision-Instruct/v1/chat/completions", model: "meta-llama/Llama-3.2-11B-Vision-Instruct" },
  ];

  const errors: string[] = [];

  for (const { url, model } of models) {
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
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          const parsed = parseAiResponse(text);
          if (parsed) return { ok: true, data: parsed };
          errors.push(`${model}: parse failed`);
        } else {
          errors.push(`${model}: empty`);
        }
      } else {
        errors.push(`${model}: HTTP ${res.status}`);
      }
    } catch (err) {
      errors.push(`${model}: ${String(err).slice(0, 60)}`);
    }
  }

  return { ok: false, error: errors.join("; ") };
}

/** Parse AI response (JSON or plain text) into title + category */
function parseAiResponse(text: string): { caption: string; title: string; category: string } | null {
  try {
    const cleaned = text.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const description = parsed.description || parsed.desc || text;
      let category = parsed.category || "";

      if (!ALL_CATEGORY_NAMES.includes(category)) {
        category = matchCategory(category) || keywordCategory(description);
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

  return {
    caption: text,
    title: formatTitle(text),
    category: keywordCategory(text),
  };
}

/** Fuzzy-match category name to our taxonomy */
function matchCategory(aiCategory: string): string {
  if (!aiCategory) return "";
  const norm = aiCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  for (const name of ALL_CATEGORY_NAMES) {
    const nameNorm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (nameNorm === norm) return name;
  }

  for (const name of ALL_CATEGORY_NAMES) {
    const nameNorm = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (nameNorm.includes(norm) || norm.includes(nameNorm)) return name;
  }

  return "";
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

  const isUseful = cleaned.length >= 3 && /[a-zA-Z]{3,}/.test(cleaned) && !/^[a-z0-9]{15,}$/i.test(cleaned);
  const category = isUseful ? keywordCategory(cleaned) : "";
  const title = isUseful ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "";

  return {
    title: title.slice(0, 120),
    category,
    caption: title
      ? `Din numele fișierului: "${title}". Poți modifica.`
      : "AI indisponibil. Completează manual titlul și categoria.",
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
  for (const node of CATEGORIES_TAXONOMY) {
    if (node.keywords.some((kw) => t.includes(kw))) return node.name;
  }
  return "";
}
