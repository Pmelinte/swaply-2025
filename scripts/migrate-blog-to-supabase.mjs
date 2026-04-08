/**
 * Migrate English blog .mdx files into the Supabase blog_posts table.
 *
 * Reads every .mdx in src/content/blog/ (root — English originals),
 * parses front-matter + body, and upserts into blog_posts with locale="en".
 *
 * Usage:
 *   SUPABASE_URL=https://... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/migrate-blog-to-supabase.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, "..", "src", "content", "blog");
const LOCALE = "en";

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ────────────────────────────────────────────────────────

function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}

function parseMdx(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const slug = path.basename(filePath, ".mdx");

  return {
    slug,
    locale: LOCALE,
    title: data.title ?? "",
    description: data.description ?? "",
    date: data.date ?? new Date().toISOString().slice(0, 10),
    author: data.author ?? "Swaply Team",
    category: data.category ?? "",
    tags: data.tags ?? [],
    cover_image: data.coverImage ?? data.image ?? null,
    seo_keyword: data.seoKeyword ?? "",
    read_time: data.readTime ?? readingTime(content),
    content,
  };
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  // 1. Clear existing rows
  console.log("Deleting existing blog_posts rows...");
  const { error: delError } = await supabase
    .from("blog_posts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all
  if (delError) {
    console.error("Delete failed:", delError.message);
    process.exit(1);
  }
  console.log("  Done.\n");

  // 2. Read all English .mdx files
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"));

  console.log(`Found ${files.length} English blog posts in ${BLOG_DIR}\n`);

  // 3. Parse and upsert
  const rows = files.map((f) => parseMdx(path.join(BLOG_DIR, f)));

  const { error: upsertError, count } = await supabase
    .from("blog_posts")
    .upsert(rows, {
      onConflict: "slug,locale",
      defaultToNull: false,
    });

  if (upsertError) {
    console.error("Upsert failed:", upsertError.message);
    process.exit(1);
  }

  console.log(`Upserted ${rows.length} blog posts (locale="${LOCALE}"):`);
  for (const row of rows) {
    console.log(`  - ${row.slug} (${row.category})`);
  }

  // 4. Verify
  const { data: verify, error: verifyErr } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("locale", LOCALE);

  if (verifyErr) {
    console.error("Verify failed:", verifyErr.message);
  } else {
    console.log(`\nVerification: ${verify.length} rows with locale="${LOCALE}" in blog_posts`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
