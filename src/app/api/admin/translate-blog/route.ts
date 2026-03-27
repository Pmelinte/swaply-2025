import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const LOCALE_NAMES: Record<string, string> = {
  it: "Italian", de: "German", fr: "French", es: "Spanish",
  pt: "Portuguese", nl: "Dutch", pl: "Polish", id: "Indonesian",
  ro: "Romanian", vi: "Vietnamese", th: "Thai", ar: "Arabic",
  ja: "Japanese", ko: "Korean", zh: "Chinese Simplified", tr: "Turkish",
  ru: "Russian", uk: "Ukrainian", hu: "Hungarian", cs: "Czech",
  sv: "Swedish", da: "Danish", fi: "Finnish", no: "Norwegian",
  el: "Greek", bg: "Bulgarian", hr: "Croatian", sr: "Serbian",
  sk: "Slovak", sl: "Slovenian", lt: "Lithuanian", lv: "Latvian",
  et: "Estonian", hi: "Hindi", bn: "Bengali", ms: "Malay",
  fil: "Filipino", mn: "Mongolian", ga: "Irish", mt: "Maltese",
  yi: "Yiddish", fa: "Persian",
};

async function translateWithClaude(text: string, targetLang: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 8192,
      system:
        `You are a professional translator. Translate the blog article to ${targetLang}. ` +
        `Keep all Markdown formatting (##, **, *, >, -, 1., etc.) intact. ` +
        `Do NOT translate: URLs, image paths, proper nouns (Swaply, DHL, FedEx, etc.), code blocks, frontmatter delimiters (---). ` +
        `Return ONLY the translated Markdown content, nothing else.`,
      messages: [{ role: "user", content: `Translate to ${targetLang}:\n\n${text}` }],
    }),
  });

  if (!res.ok) throw new Error(`Claude API error ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ text: string }> };
  return data.content?.[0]?.text ?? text;
}

/**
 * POST /api/admin/translate-blog
 * Translates a blog article's frontmatter (title, description) and content.
 * Returns the translated MDX as a string.
 *
 * Body: { secret, slug, locale }
 * Response: { slug, locale, mdx }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { secret, slug, locale } = body as { secret?: string; slug?: string; locale?: string };

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!slug || !locale || !LOCALE_NAMES[locale]) {
    return NextResponse.json({ error: "Missing slug or invalid locale" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const blogDir = join(process.cwd(), "src", "content", "blog");
  const filePath = join(blogDir, `${slug}.mdx`);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const raw = readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(raw);
  const langName = LOCALE_NAMES[locale];

  // Translate title and description
  const [translatedTitle, translatedDesc] = await Promise.all([
    translateWithClaude(frontmatter.title, langName, apiKey),
    translateWithClaude(frontmatter.description, langName, apiKey),
  ]);

  // Translate content in chunks (split by ## headings to stay within token limits)
  const sections = content.split(/(?=^## )/m);
  const translatedSections: string[] = [];

  for (const section of sections) {
    if (section.trim().length < 10) {
      translatedSections.push(section);
      continue;
    }
    try {
      const translated = await translateWithClaude(section.trim(), langName, apiKey);
      translatedSections.push(translated);
    } catch {
      translatedSections.push(section); // fallback to original on error
    }
  }

  // Rebuild MDX with translated frontmatter
  const newFrontmatter = {
    ...frontmatter,
    title: translatedTitle.replace(/^["']|["']$/g, ""),
    description: translatedDesc.replace(/^["']|["']$/g, ""),
  };

  const mdx = matter.stringify(translatedSections.join("\n\n"), newFrontmatter);

  return NextResponse.json({ slug, locale, mdx });
}
