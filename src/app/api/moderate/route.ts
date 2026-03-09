import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { moderateSchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";

/** Words/patterns that indicate content needing moderation */
const BLOCKED_PATTERNS = [
  // Personal data patterns
  /\b\d{10,}\b/, // phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // emails
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses
  /\bIBAN\b/i,
  /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/, // IBAN format
];

const PROFANITY_RO = [
  "prost", "idiot", "cretin", "imbecil", "tampit",
  "fraier", "suge", "futu", "cacat", "rahat",
  "curva", "tarfa",
];

const PROFANITY_EN = [
  "fuck", "shit", "ass", "bitch", "damn",
  "stupid", "idiot", "moron",
];

const PROFANITY_ES = [
  "mierda", "puta", "joder", "idiota", "estupido",
  "culo", "cabron",
];

const ALL_PROFANITY = [...PROFANITY_RO, ...PROFANITY_EN, ...PROFANITY_ES];

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed } = rateLimit(ip, { limit: 60, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ safe: true, flags: [], message: "Rate limited" }, { status: 429 });
  }

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(body, moderateSchema);
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json({ safe: false, flags: ["invalid_input"], message: validationError }, { status: 400 });
  }
  const { text } = validated!;

  if (!text) {
    return NextResponse.json({ safe: true, flags: [] });
  }

  const flags: string[] = [];
  const lower = text.toLowerCase();

  // Check for personal data leaks
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      flags.push("date_personale");
      break;
    }
  }

  // Check for profanity
  const foundProfanity = ALL_PROFANITY.filter((word) =>
    lower.includes(word.toLowerCase()),
  );
  if (foundProfanity.length > 0) {
    flags.push("limbaj_inadecvat");
  }

  // Check for spam patterns
  if (text.length > 500) flags.push("mesaj_prea_lung");
  if (/(.)\1{5,}/.test(text)) flags.push("spam_caractere");
  if ((text.match(/https?:\/\//g) || []).length > 2) flags.push("spam_linkuri");

  // HuggingFace sentiment analysis for toxic content (optional)
  const hfKey = process.env.HUGGINGFACE_API_KEY;
  if (hfKey && flags.length === 0) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/unitary/toxic-bert",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: text }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        // toxic-bert returns [[{label, score},...]]
        const results = Array.isArray(data?.[0]) ? data[0] : [];
        for (const r of results) {
          if (r.label === "toxic" && r.score > 0.7) {
            flags.push("toxic_ai");
          }
        }
      }
    } catch {
      // AI moderation is optional, don't block on failure
    }
  }

  return NextResponse.json({
    safe: flags.length === 0,
    flags,
    message: flags.length > 0
      ? `Mesaj blocat: ${flags.join(", ")}`
      : undefined,
  });
}
