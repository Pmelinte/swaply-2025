import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/rate-limit";
import { requestLogger, captureError } from "@/lib/logger";

/**
 * POST /api/match-semantic
 *
 * Finds semantically similar items using pgvector cosine similarity.
 *
 * Body: {
 *   itemId: string,            — source item to find matches for
 *   threshold?: number,        — minimum similarity (default 0.5)
 *   limit?: number,            — max results (default 20)
 *   filterCity?: string,       — optional city filter
 *   filterCategory?: string,   — optional category filter
 * }
 *
 * Returns: { matches: Array<{ id, title, category, ownerId, location, semanticScore }> }
 */

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

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

  if (!res.ok) throw new Error(`HuggingFace API error ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data) && typeof data[0] === "number") return data;
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0];
  throw new Error("Unexpected HuggingFace response shape");
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 30, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const log = requestLogger(request);

  try {
    const body = await request.json();
    const itemId = typeof body.itemId === "string" ? body.itemId.trim() : "";
    const threshold = typeof body.threshold === "number" ? Math.max(0, Math.min(1, body.threshold)) : 0.5;
    const limit = typeof body.limit === "number" ? Math.max(1, Math.min(50, body.limit)) : 20;
    const filterCity = typeof body.filterCity === "string" ? body.filterCity.trim() || null : null;
    const filterCategory = typeof body.filterCategory === "string" ? body.filterCategory.trim() || null : null;

    if (!itemId) {
      return NextResponse.json({ error: "itemId is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Fetch source item
    const { data: item, error: fetchError } = await supabase
      .from("items")
      .select("id, title, description, category, wishlist, ai_suggested_tags, user_final_tags, owner_id, embedding")
      .eq("id", itemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Use existing embedding or generate on-the-fly
    let embedding: number[];
    if (item.embedding) {
      // Embedding stored as JSON string in pgvector column — parse it
      embedding = typeof item.embedding === "string" ? JSON.parse(item.embedding) : item.embedding;
    } else {
      const parts = [item.title];
      if (item.description) parts.push(item.description);
      if (item.category) parts.push(item.category);
      if (item.wishlist) parts.push(`Looking for: ${item.wishlist}`);
      const tags = [...(item.ai_suggested_tags ?? []), ...(item.user_final_tags ?? [])];
      if (tags.length > 0) parts.push(`Tags: ${tags.join(", ")}`);
      const text = parts.join(" ").slice(0, 512);
      embedding = await generateEmbedding(text);
    }

    // Call the match_objects RPC function
    const { data: results, error: rpcError } = await supabase.rpc("match_objects", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: threshold,
      match_count: limit,
      filter_city: filterCity,
      filter_category: filterCategory,
      exclude_owner_id: item.owner_id,
    });

    if (rpcError) {
      log.warn("match_objects RPC failed", { error: rpcError.message });
      return NextResponse.json({ error: "Semantic search failed" }, { status: 500 });
    }

    const matches = (results ?? []).map((r: { id: string; title: string; category: string; owner_id: string; location: string; match_score: number }) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      ownerId: r.owner_id,
      location: r.location,
      semanticScore: Math.round(r.match_score * 100) / 100,
    }));

    return NextResponse.json({ matches });
  } catch (err) {
    captureError(err, { route: "/api/match-semantic" });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
