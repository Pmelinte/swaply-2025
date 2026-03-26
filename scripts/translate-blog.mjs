/**
 * Translate blog articles via Vercel admin endpoint.
 * Usage: node scripts/translate-blog.mjs [baseUrl] [secret]
 */
import fs from "fs";
import path from "path";

const BASE_URL = process.argv[2] || "https://swaply-2025-git-claude-fix-issue-z2ymi-petrus-projects-d4a0946c.vercel.app";
const SECRET = process.argv[3] || "swaply-translate-2026";
const LOCALES = ["it", "de", "fr", "es", "pt", "nl", "pl", "id"];
const BLOG_DIR = "src/content/blog";

// Get all slugs
const slugs = fs.readdirSync(BLOG_DIR)
  .filter(f => f.endsWith(".mdx") && !f.includes("/"))
  .map(f => f.replace(".mdx", ""));

console.log(`Found ${slugs.length} articles, translating to ${LOCALES.length} languages`);

async function translateArticle(slug, locale) {
  const outDir = path.join(BLOG_DIR, locale);
  const outPath = path.join(outDir, `${slug}.mdx`);

  if (fs.existsSync(outPath)) {
    return "skip"; // Already translated
  }

  const res = await fetch(`${BASE_URL}/api/admin/translate-blog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: SECRET, slug, locale }),
  });

  if (!res.ok) return `error:${res.status}`;

  const data = await res.json();
  if (!data.mdx) return "error:no-mdx";

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, data.mdx);
  return "ok";
}

async function main() {
  let total = 0;
  for (const locale of LOCALES) {
    console.log(`\n=== ${locale.toUpperCase()} ===`);
    for (const slug of slugs) {
      const result = await translateArticle(slug, locale);
      if (result === "ok") {
        total++;
        console.log(`  ✓ ${slug}`);
      } else if (result === "skip") {
        console.log(`  - ${slug} (exists)`);
      } else {
        console.log(`  ✗ ${slug}: ${result}`);
      }
      await new Promise(r => setTimeout(r, 500)); // rate limit
    }
  }
  console.log(`\nDone: ${total} articles translated`);
}

main().catch(e => { console.error(e); process.exit(1); });
