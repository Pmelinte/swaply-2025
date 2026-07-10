import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { requestLogger, captureError } from "@/lib/logger";

/**
 * POST /api/embeddings
 *
 * Generates a vector embedding for an item using HuggingFace Inference API
 * (sentence-transformers/all-MiniLM-L6-v2, 384 dimensions) and stores it
 * in the items.embedding column.
 *
 * Body: { itemId: string }
 *
 * Called after item create/update to keep embeddings fresh.
 */

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

function buildEmbeddingText(item: {
  title: string;
  description?: string | null;
  category?: string | null;
  wishlist?: string | null;
  ai_suggested_tags?: string[] | null;
  user_final_tags?: string[] | null;
}): string {
  const parts = [item.title];
  if (item.description) parts.push(item.description);
  if (item.category) parts.push(item.category);
  if (item.wishlist) parts.push(`Looking for: ${item.wishlist}`);
  const tags = [...(item.ai_suggested_tags ?? []), ...(item.user_final_tags ?? [])];
  if (tags.length > 0) parts.push(`Tags: ${tags.join(", ")}`);
  return parts.join(" ").slice(0, 512);
}

async function generateEmbedding(text: string): Promise<number[]> {
  const key = process.env.HUGGINGFACE_API_KEY;
  if (!key) throw new Error("HUGGINGFACE_API_KEY not configured");

  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HuggingFace API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && typeof data[0] === "number") return data;
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
  throw new Error("Unexpected HuggingFace response shape");
}

export async function POST(request: Request) {
  const log = requestLogger(request);

  try {
    const session = await getServerSupabase();
    const {
      data: { user },
    } = session
      ? await session.auth.getUser()
      : { data: { user: null } };

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const body = await request.json();
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Fetch item data
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id, title, description, category, wishlist, ai_suggested_tags, user_final_tags, owner_id")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      log.warn("Item not found", { itemId });
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate embedding
    const text = buildEmbeddingText(item);
    const embedding = await generateEmbedding(text);

    // Store embedding
    const { error: updateError } = await supabase
      .from("items")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", itemId);

    if (updateError) {
      log.warn("Failed to store embedding", { itemId, error: updateError.message });
      return NextResponse.json({ error: "Failed to store embedding" }, { status: 500 });
    }

    return NextResponse.json({ success: true, dimensions: embedding.length });
  } catch (err) {
    captureError(err, { route: "/api/embeddings" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
