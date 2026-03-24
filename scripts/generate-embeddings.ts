/**
 * Batch embedding generator for items using HuggingFace Inference API.
 *
 * Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
 *
 * Usage:  npx tsx scripts/generate-embeddings.ts
 *
 * Requires in .env.local:
 *   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - HUGGINGFACE_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// ── Load .env.local ──
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hfApiKey = process.env.HUGGINGFACE_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!hfApiKey) {
  console.error("Missing HUGGINGFACE_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const HF_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_URL = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;
const BATCH_SIZE = 32;

/**
 * Generate embedding for a single text via HuggingFace Inference API.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${hfApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      options: { wait_for_model: true },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HuggingFace API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  // API returns number[] for single input
  if (Array.isArray(data) && typeof data[0] === "number") {
    return data as number[];
  }
  // Sometimes returns nested array for batch
  if (Array.isArray(data) && Array.isArray(data[0])) {
    return data[0] as number[];
  }
  throw new Error(`Unexpected HuggingFace response shape: ${JSON.stringify(data).slice(0, 200)}`);
}

/**
 * Build the text input for embedding from item fields.
 */
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
  // Truncate to ~512 chars for optimal embedding quality
  return parts.join(" ").slice(0, 512);
}

async function main() {
  console.log("Fetching items without embeddings...");

  const { data: items, error } = await supabase
    .from("items")
    .select("id, title, description, category, wishlist, ai_suggested_tags, user_final_tags")
    .is("embedding", null)
    .eq("status", "active")
    .limit(1000);

  if (error) {
    console.error("Failed to fetch items:", error.message);
    process.exit(1);
  }

  if (!items || items.length === 0) {
    console.log("All items already have embeddings. Nothing to do.");
    return;
  }

  console.log(`Found ${items.length} items to process.`);
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      try {
        const text = buildEmbeddingText(item);
        const embedding = await generateEmbedding(text);

        const { error: updateError } = await supabase
          .from("items")
          .update({ embedding: JSON.stringify(embedding) })
          .eq("id", item.id);

        if (updateError) {
          console.error(`Failed to update item ${item.id}: ${updateError.message}`);
          failed++;
        } else {
          processed++;
        }
      } catch (err) {
        console.error(`Error processing item ${item.id}:`, err);
        failed++;
      }
    }

    console.log(`Progress: ${Math.min(i + BATCH_SIZE, items.length)}/${items.length} (${failed} failed)`);

    // Rate limit: small delay between batches
    if (i + BATCH_SIZE < items.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\nDone! Processed: ${processed}, Failed: ${failed}, Total: ${items.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
