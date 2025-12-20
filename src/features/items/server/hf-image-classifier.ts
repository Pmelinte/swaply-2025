// src/features/items/server/hf-image-classifier.ts

export type HfClassifierResult = {
  ok: true;
  primaryLabel: string;
  confidence: number | null;
  suggestedTitle: string;
  suggestedTags: string[];
  raw: unknown;
} | {
  ok: false;
  error: string;
};

function humanizeLabel(label: string): string {
  const s = (label ?? "").trim();
  if (!s) return "Obiect";
  // mic “cleanup” ca să nu arate ca un slug
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Clasifică o imagine folosind Hugging Face Inference API.
 * Primește un URL public (ideal Cloudinary).
 *
 * ENV necesare (server-side):
 * - HUGGINGFACE_API_TOKEN (obligatoriu)
 * - HUGGINGFACE_IMAGE_MODEL (opțional; default: google/vit-base-patch16-224)
 */
export async function classifyImageByUrl(imageUrl: string): Promise<HfClassifierResult> {
  const token = process.env.HUGGINGFACE_API_TOKEN;
  const model = process.env.HUGGINGFACE_IMAGE_MODEL || "google/vit-base-patch16-224";

  if (!token) {
    return { ok: false, error: "hf_token_missing" };
  }

  const url = (imageUrl ?? "").trim();
  if (!url) {
    return { ok: false, error: "missing_image_url" };
  }

  // 1) Download imaginea (server-side)
  const imgRes = await fetch(url, { cache: "no-store" });
  if (!imgRes.ok) {
    return { ok: false, error: "failed_to_fetch_image" };
  }
  const bytes = new Uint8Array(await imgRes.arrayBuffer());

  // 2) Call HF Inference
  const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/octet-stream",
    },
    body: bytes,
    cache: "no-store",
  });

  const rawText = await hfRes.text();
  let rawJson: any = null;
  try {
    rawJson = rawText ? JSON.parse(rawText) : null;
  } catch {
    rawJson = rawText;
  }

  if (!hfRes.ok) {
    // HF poate răspunde cu “Model is loading” etc.
    return { ok: false, error: "hf_inference_error" };
  }

  // De obicei HF image-classification returnează array [{label,score}, ...]
  const arr = Array.isArray(rawJson) ? rawJson : [];
  const best = arr[0];

  const label = typeof best?.label === "string" ? best.label : "";
  const score = typeof best?.score === "number" ? best.score : null;

  const primaryLabel = label || "object";
  const confidence = score;

  const suggestedTitle = humanizeLabel(primaryLabel);

  // Tags = top 5 labels “humanized”
  const suggestedTags = arr
    .slice(0, 5)
    .map((x: any) => (typeof x?.label === "string" ? humanizeLabel(x.label) : ""))
    .filter((x: string) => x.length > 0);

  return {
    ok: true,
    primaryLabel,
    confidence,
    suggestedTitle,
    suggestedTags,
    raw: rawJson,
  };
}
