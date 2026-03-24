/**
 * AI-powered SEO content generator for category+city landing pages.
 *
 * Generates unique h1, intro paragraph, meta title, and meta description
 * for each category × city combination using Groq LLM (fast) with Gemini fallback.
 *
 * Usage:  npx tsx scripts/generate-seo-content.ts
 *
 * Requires in .env.local:
 *   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - GROQ_API_KEY and/or GEMINI_API_KEY
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
const groqKey = process.env.GROQ_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!groqKey && !geminiKey) {
  console.error("Missing GROQ_API_KEY or GEMINI_API_KEY — need at least one LLM provider");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── SEO data (must match src/lib/seo-data.ts) ──

interface SEOCategory {
  slug: string;
  nameLocal: string;
  dbCategory: string;
}

interface SEOCity {
  slug: string;
  name: string;
}

const SEO_CATEGORIES: SEOCategory[] = [
  { slug: "electronics", nameLocal: "Electronics", dbCategory: "Electronică" },
  { slug: "sport", nameLocal: "Sport & Outdoor", dbCategory: "Sport & Outdoor" },
  { slug: "arts", nameLocal: "Art & Hobby", dbCategory: "Hobby & Jocuri" },
  { slug: "books", nameLocal: "Books & Media", dbCategory: "Cărți & Media" },
  { slug: "home", nameLocal: "Home & Garden", dbCategory: "Casă & Grădină" },
  { slug: "fashion", nameLocal: "Fashion & Accessories", dbCategory: "Modă & Accesorii" },
  { slug: "automotive", nameLocal: "Auto & Moto", dbCategory: "Auto & Moto" },
  { slug: "music", nameLocal: "Music & Audio", dbCategory: "Muzică & Audio" },
  { slug: "garden", nameLocal: "Gardening & Outdoor", dbCategory: "Grădinărit & Exterior" },
  { slug: "toys", nameLocal: "Toys & Kids", dbCategory: "Jucării & Copii" },
  { slug: "tools", nameLocal: "Tools & DIY", dbCategory: "Unelte & Bricolaj" },
];

const SEO_CITIES: SEOCity[] = [
  { slug: "london", name: "London" },
  { slug: "berlin", name: "Berlin" },
  { slug: "paris", name: "Paris" },
  { slug: "madrid", name: "Madrid" },
  { slug: "rome", name: "Rome" },
  { slug: "amsterdam", name: "Amsterdam" },
  { slug: "vienna", name: "Vienna" },
  { slug: "prague", name: "Prague" },
  { slug: "stockholm", name: "Stockholm" },
  { slug: "warsaw", name: "Warsaw" },
  { slug: "budapest", name: "Budapest" },
  { slug: "lisbon", name: "Lisbon" },
  { slug: "barcelona", name: "Barcelona" },
  { slug: "munich", name: "Munich" },
  { slug: "milan", name: "Milan" },
];

// ── LLM calls ──

interface SeoContent {
  h1: string;
  intro_paragraph: string;
  meta_title: string;
  meta_description: string;
}

function buildPrompt(category: string, city: string): string {
  return `Generate SEO content for a barter/swap landing page.

Page: Swapping ${category} items in ${city}
Platform: Swaply — a free barter platform where users exchange items directly, no money involved.

Return ONLY valid JSON with these exact keys:
{
  "h1": "A catchy H1 title for the page (50-70 chars, include city and category)",
  "intro_paragraph": "An SEO-friendly paragraph of 80-100 words. Mention Swaply is free barter. Include natural keywords for ${category} swapping in ${city}. Don't sound robotic. Be engaging and specific to the city.",
  "meta_title": "SEO meta title (50-60 chars, include category + city + Swaply)",
  "meta_description": "SEO meta description (140-155 chars, compelling with CTA)"
}`;
}

async function callGroq(prompt: string): Promise<string | null> {
  if (!groqKey) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are an SEO content writer for a barter platform. Always respond with valid JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function callGemini(prompt: string): Promise<string | null> {
  if (!geminiKey) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: "You are an SEO content writer. Always respond with valid JSON only." }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500, responseMimeType: "application/json" },
        }),
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

function parseResponse(raw: string | null): SeoContent | null {
  if (!raw) return null;
  try {
    const json = JSON.parse(raw);
    if (
      typeof json.h1 === "string" &&
      typeof json.intro_paragraph === "string" &&
      typeof json.meta_title === "string" &&
      typeof json.meta_description === "string"
    ) {
      return {
        h1: json.h1.slice(0, 200),
        intro_paragraph: json.intro_paragraph.slice(0, 2000),
        meta_title: json.meta_title.slice(0, 150),
        meta_description: json.meta_description.slice(0, 300),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function generateContent(category: string, city: string): Promise<SeoContent | null> {
  const prompt = buildPrompt(category, city);

  // Try Groq first (fast), fall back to Gemini
  let raw = await callGroq(prompt);
  let parsed = parseResponse(raw);
  if (parsed) return parsed;

  raw = await callGemini(prompt);
  parsed = parseResponse(raw);
  return parsed;
}

// ── Main ──

async function main() {
  const totalCombinations = SEO_CATEGORIES.length * SEO_CITIES.length;
  console.log(`Generating SEO content for ${totalCombinations} category × city combinations...`);

  // Check what already exists
  const { data: existing } = await supabase
    .from("seo_content")
    .select("category_slug, city_slug")
    .eq("page_type", "category_city")
    .eq("lang", "en");

  const existingSet = new Set(
    (existing ?? []).map(
      (r: { category_slug: string; city_slug: string }) => `${r.category_slug}:${r.city_slug}`,
    ),
  );

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const city of SEO_CITIES) {
    for (const cat of SEO_CATEGORIES) {
      const key = `${cat.slug}:${city.slug}`;

      if (existingSet.has(key)) {
        skipped++;
        continue;
      }

      try {
        const content = await generateContent(cat.nameLocal, city.name);
        if (!content) {
          console.error(`  ✗ Failed: ${cat.nameLocal} × ${city.name} — no valid LLM response`);
          failed++;
          continue;
        }

        const { error } = await supabase.from("seo_content").upsert({
          page_type: "category_city",
          category_slug: cat.slug,
          city_slug: city.slug,
          lang: "en",
          h1: content.h1,
          intro_paragraph: content.intro_paragraph,
          meta_title: content.meta_title,
          meta_description: content.meta_description,
        }, { onConflict: "page_type,category_slug,city_slug,lang" });

        if (error) {
          console.error(`  ✗ DB error for ${cat.nameLocal} × ${city.name}: ${error.message}`);
          failed++;
        } else {
          generated++;
          console.log(`  ✓ ${cat.nameLocal} × ${city.name}: "${content.h1}"`);
        }
      } catch (err) {
        console.error(`  ✗ Error: ${cat.nameLocal} × ${city.name}:`, err);
        failed++;
      }

      // Rate limit: 500ms between requests
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}, Total: ${totalCombinations}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
