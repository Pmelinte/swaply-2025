/**
 * One-time migration script: MDX files → Supabase blog_posts table
 *
 * Reads English .mdx files from src/content/blog/ (root, NOT the ro/ subfolder)
 * and upserts into blog_posts with locale="en".
 *
 * Run via GitHub Actions or locally with:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/migrate-blog-to-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { join, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("No frontmatter found");

  const frontmatter = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of lines) {
    if (line.startsWith("  - ") && inArray) {
      arrayValues.push(line.replace("  - ", "").replace(/^["']|["']$/g, "").trim());
      continue;
    }
    if (inArray) {
      frontmatter[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
    }
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim();

    if (value === "" || value === "[]") {
      currentKey = key;
      inArray = true;
      arrayValues = [];
    } else if (value.startsWith("[")) {
      // inline array: ["tag1", "tag2"]
      frontmatter[key] = JSON.parse(value.replace(/'/g, '"'));
    } else {
      frontmatter[key] = value.replace(/^["']|["']$/g, "");
    }
  }
  if (inArray && arrayValues.length > 0) {
    frontmatter[currentKey] = arrayValues;
  }

  return { frontmatter, body: match[2].trim() };
}

async function migrate() {
  // 1. Delete all existing rows
  console.log("Deleting existing blog_posts rows...");
  const { error: delError } = await supabase
    .from("blog_posts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) {
    console.error("Delete failed:", delError.message);
    process.exit(1);
  }
  console.log("  Done.\n");

  // 2. Read English .mdx files from root blog dir (NOT the ro/ subfolder)
  const blogDir = join(__dirname, "../src/content/blog");
  const files = readdirSync(blogDir).filter(
    (f) => f.endsWith(".mdx") // only root-level .mdx, not subdirectories
  );

  console.log(`Found ${files.length} English MDX files to migrate`);

  let success = 0;
  let errors = 0;

  for (const file of files) {
    const slug = basename(file, ".mdx");
    const content = readFileSync(join(blogDir, file), "utf-8");

    try {
      const { frontmatter, body } = parseFrontmatter(content);

      const record = {
        slug,
        locale: "en",
        title: frontmatter.title || slug,
        description: frontmatter.description || null,
        content_md: body,
        date: frontmatter.date || new Date().toISOString().split("T")[0],
        category: frontmatter.category || null,
        author: frontmatter.author || "Swaply Team",
        read_time: frontmatter.readTime || null,
        image: frontmatter.image || null,
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        published: true,
      };

      const { error } = await supabase
        .from("blog_posts")
        .upsert(record, { onConflict: "slug,locale" });

      if (error) {
        console.error(`❌ ${slug}: ${error.message}`);
        errors++;
      } else {
        console.log(`✅ ${slug}`);
        success++;
      }
    } catch (e) {
      console.error(`❌ ${slug}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone: ${success} success, ${errors} errors`);
}

migrate();
