import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

const LOCALE_NAMES: Record<string, string> = {
  it: "Italian", de: "German", fr: "French", es: "Spanish", pt: "Portuguese",
  nl: "Dutch", pl: "Polish", id: "Indonesian", vi: "Vietnamese", th: "Thai",
  ro: "Romanian", hu: "Hungarian", cs: "Czech", sk: "Slovak", bg: "Bulgarian",
  hr: "Croatian", sl: "Slovenian", sr: "Serbian", sv: "Swedish", da: "Danish",
  fi: "Finnish", no: "Norwegian", lt: "Lithuanian", lv: "Latvian", et: "Estonian",
  ga: "Irish", mt: "Maltese", ru: "Russian", tr: "Turkish", ar: "Arabic",
  zh: "Chinese Simplified", hi: "Hindi", bn: "Bengali", ja: "Japanese",
  ko: "Korean", el: "Greek", fa: "Persian", mn: "Mongolian", uk: "Ukrainian",
  yi: "Yiddish", ms: "Malay", fil: "Filipino",
};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: string): void {
  const parts = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur) || typeof cur[parts[i]] !== "object") {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

function flattenKeys(
  obj: Record<string, unknown>,
  localeData: Record<string, unknown>,
  prefix = "",
): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" && v.length > 3) {
      const localeValue = getNestedValue(localeData, key);
      if (localeValue === v) {
        result.push({ key, value: v });
      }
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      result.push(...flattenKeys(v as Record<string, unknown>, localeData, key));
    }
  }
  return result;
}

async function translateBatch(
  texts: string[],
  targetLang: string,
  apiKey: string,
): Promise<string[]> {
  const numbered = texts.map((t, i) => `[${i + 1}] ${t}`).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      system:
        `You are a professional UI translator for Swaply, a global barter/swap marketplace. ` +
        `Translate each numbered line to ${targetLang}. Keep the same numbered format [1] [2] etc. ` +
        `Return ONLY the numbered translations. Preserve {variables} and HTML tags as-is.`,
      messages: [
        { role: "user", content: `Translate to ${targetLang}:\n${numbered}` },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ text: string }>;
  };
  const output = data.content?.[0]?.text ?? "";

  const results: string[] = new Array(texts.length).fill("");
  for (const line of output.split("\n")) {
    const m = line.match(/^\[(\d+)\]\s*(.+)$/);
    if (m) {
      const idx = parseInt(m[1]) - 1;
      if (idx >= 0 && idx < texts.length) {
        results[idx] = m[2].trim();
      }
    }
  }
  return results;
}

/**
 * POST /api/admin/translate-ui
 *
 * Translates up to 50 untranslated UI strings for a given locale.
 * Call repeatedly until remaining === 0.
 *
 * Body: { secret: string, locale: string }
 * Response: { translated: number, remaining: number, locale: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { secret, locale } = body as { secret?: string; locale?: string };

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!locale || !LOCALE_NAMES[locale]) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const messagesDir = join(process.cwd(), "src", "messages");
  const enPath = join(messagesDir, "en.json");
  const localePath = join(messagesDir, `${locale}.json`);

  const en = JSON.parse(readFileSync(enPath, "utf-8")) as Record<string, unknown>;
  const localeData = JSON.parse(readFileSync(localePath, "utf-8")) as Record<string, unknown>;

  const untranslated = flattenKeys(en, localeData);
  const totalRemaining = untranslated.length;

  if (totalRemaining === 0) {
    return NextResponse.json({ translated: 0, remaining: 0, locale });
  }

  // Process in batches of 25 (2 batches = 50 per request)
  const BATCH_SIZE = 25;
  const MAX_PER_REQUEST = 50;
  const toProcess = untranslated.slice(0, MAX_PER_REQUEST);
  let translated = 0;
  const langName = LOCALE_NAMES[locale];
  const results: Record<string, string> = {};

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    const texts = batch.map((b) => b.value);

    try {
      const batchResults = await translateBatch(texts, langName, apiKey);
      for (let j = 0; j < batch.length; j++) {
        if (batchResults[j]) {
          results[batch[j].key] = batchResults[j];
          translated++;
        }
      }
    } catch (e) {
      console.error(`[translate-ui] Batch error for ${locale}:`, e instanceof Error ? e.message : e);
    }
  }

  // Return translations as data (Vercel filesystem is read-only)
  return NextResponse.json({
    translated,
    remaining: totalRemaining - translated,
    locale,
    translations: results,
  });
}
