import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { aiChatAssistSchema, validateBody } from "@/lib/validation";
import { requestLogger } from "@/lib/logger";

/** AI Chat Assist actions */
type ChatAssistAction =
  | "rephrase_polite"
  | "translate"
  | "summarize_offer"
  | "generate_response"
  | "generate_checklist";

/** Per-tier daily AI assist limits */
const TIER_LIMITS: Record<string, number> = {
  free: 10,
  premium: 50,
  platinum: 999999, // effectively unlimited
};

/** Daily usage store: key = `${userId}:${date}` */
const dailyUsage = new Map<string, number>();

function getDailyKey(userId: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${userId}:${today}`;
}

function checkDailyLimit(userId: string, tier: string): { allowed: boolean; used: number; limit: number } {
  const key = getDailyKey(userId);
  const used = dailyUsage.get(key) ?? 0;
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
  return { allowed: used < limit, used, limit };
}

function incrementUsage(userId: string): void {
  const key = getDailyKey(userId);
  dailyUsage.set(key, (dailyUsage.get(key) ?? 0) + 1);
}

// Cleanup old daily entries every hour
setInterval(() => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [key] of dailyUsage) {
    if (!key.endsWith(today)) dailyUsage.delete(key);
  }
}, 60 * 60 * 1000);

/** Pre-send moderation: check for offensive language, personal data, external links */
function moderateMessage(text: string): { safe: boolean; warning?: string; suggestion?: string } {
  // Check for personal data patterns
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/;
  if (emailPattern.test(text)) {
    return { safe: false, warning: "personal_data_email" };
  }
  if (phonePattern.test(text)) {
    return { safe: false, warning: "personal_data_phone" };
  }

  // Check for external links
  const urlPattern = /https?:\/\/[^\s]+/i;
  if (urlPattern.test(text)) {
    return { safe: false, warning: "external_link" };
  }

  // Check for offensive language (basic word list)
  const offensiveWords = [
    "idiot", "prost", "cretin", "imbecil", "handicapat", "retardat",
    "stupid", "fraier", "dobitoc", "bou", "tampit", "nenorocit",
    "gunoi", "jeg", "scursura", "damn", "shit", "fuck", "ass",
    "bastard", "moron", "dumb",
  ];
  const lower = text.toLowerCase();
  const found = offensiveWords.find((w) => lower.includes(w));
  if (found) {
    return { safe: false, warning: "offensive_language", suggestion: "rephrase" };
  }

  return { safe: true };
}

/** Rephrase message more politely */
function rephrasePolite(message: string): string {
  // Simple heuristic-based rephrasing
  let text = message.trim();

  // Remove aggressive punctuation
  text = text.replace(/!{2,}/g, ".");
  text = text.replace(/\?{2,}/g, "?");

  // Soften demanding language (RO)
  text = text.replace(/\bvreau\b/gi, "aș dori");
  text = text.replace(/\btrebuie\b/gi, "ar fi bine");
  text = text.replace(/\bdă-mi\b/gi, "ai putea să-mi dai");
  text = text.replace(/\bnu accept\b/gi, "aș prefera altceva");
  text = text.replace(/\bnu vreau\b/gi, "nu sunt sigur dacă");
  text = text.replace(/\bnu-mi place\b/gi, "aș prefera o altă variantă");

  // Soften demanding language (EN)
  text = text.replace(/\bI want\b/gi, "I would like");
  text = text.replace(/\bgive me\b/gi, "could you please provide");
  text = text.replace(/\bI need\b/gi, "I would appreciate");
  text = text.replace(/\byou must\b/gi, "it would be great if you could");
  text = text.replace(/\bI don't accept\b/gi, "I'd prefer a different option");
  text = text.replace(/\bI don't want\b/gi, "I'm not sure about");
  text = text.replace(/\bno way\b/gi, "I'd rather explore other options");

  // Add polite opener if none exists
  const politeStarters = ["bună", "salut", "hello", "hi ", "hey", "please", "te rog", "vă rog"];
  const hasPoliteStart = politeStarters.some((s) => text.toLowerCase().startsWith(s));
  if (!hasPoliteStart && text.length > 20) {
    // Detect language
    const isRo = /[ăâîșț]/i.test(text) || /\b(eu|tu|el|ea|sunt|este|pentru)\b/i.test(text);
    text = isRo ? `Bună! ${text}` : `Hi! ${text}`;
  }

  // Add polite closer if not present
  const politeEnders = ["mulțumesc", "mersi", "thanks", "thank you", "te rog"];
  const hasPoliteEnd = politeEnders.some((e) => text.toLowerCase().includes(e));
  if (!hasPoliteEnd && text.length > 30) {
    const isRo = /[ăâîșț]/i.test(text) || /\b(eu|tu|el|ea|sunt|este|pentru)\b/i.test(text);
    text = isRo ? `${text} Mulțumesc!` : `${text} Thanks!`;
  }

  return text;
}

/** Detect language of text */
function detectLanguage(text: string): string {
  if (/[ăâîșț]/i.test(text)) return "ro";
  if (/[ñáéíóú¿¡]/i.test(text)) return "es";
  if (/[àâçèéêëîïôùûü]/i.test(text)) return "fr";
  if (/[äöüß]/i.test(text)) return "de";
  return "en";
}

/** Simple translate placeholder (maps to /api/translate in production) */
function translateMessage(message: string, detectedLang: string): { translated: string; from: string; to: string } {
  // Basic word-level translations for common swap phrases
  const roToEn: Record<string, string> = {
    "bună": "hello", "salut": "hi", "mulțumesc": "thank you", "da": "yes", "nu": "no",
    "schimb": "swap", "obiect": "item", "stare": "condition", "nou": "new", "folosit": "used",
    "accept": "I accept", "refuz": "I decline", "preț": "price", "livrare": "delivery",
    "întâlnire": "meeting", "locație": "location", "perfect": "perfect", "bine": "good",
  };
  const enToRo: Record<string, string> = Object.fromEntries(
    Object.entries(roToEn).map(([k, v]) => [v, k]),
  );

  if (detectedLang === "ro") {
    let translated = message;
    for (const [ro, en] of Object.entries(roToEn)) {
      translated = translated.replace(new RegExp(`\\b${ro}\\b`, "gi"), en);
    }
    return { translated, from: "ro", to: "en" };
  }
  // Default: translate to Romanian
  let translated = message;
  for (const [en, ro] of Object.entries(enToRo)) {
    translated = translated.replace(new RegExp(`\\b${en}\\b`, "gi"), ro);
  }
  return { translated, from: detectedLang, to: "ro" };
}

/** Summarize the swap offer from context */
function summarizeOffer(swapContext: {
  reqItem?: string;
  resItem?: string;
  status?: string;
  logistics?: string;
  meetupPoint?: string;
}): string {
  const lines: string[] = [];
  if (swapContext.reqItem && swapContext.resItem) {
    lines.push(`Schimb propus: "${swapContext.reqItem}" ↔ "${swapContext.resItem}"`);
  }
  if (swapContext.status) {
    lines.push(`Status: ${swapContext.status}`);
  }
  if (swapContext.logistics) {
    lines.push(`Logistică: ${swapContext.logistics}`);
  }
  if (swapContext.meetupPoint) {
    lines.push(`Punct de întâlnire: ${swapContext.meetupPoint}`);
  }
  if (lines.length === 0) {
    return "Nu există context de schimb activ pentru această conversație.";
  }
  return lines.join("\n");
}

/** Generate 3 response variants for negotiation */
function generateResponse(
  message: string,
  conversationContext: string[],
  swapContext?: { reqItem?: string; resItem?: string },
): Array<{ type: string; emoji: string; label: string; text: string }> {
  const isRo = /[ăâîșț]/i.test(message) || /\b(eu|tu|el|ea|sunt|este|pentru|schimb|obiect)\b/i.test(message);
  const itemA = swapContext?.reqItem ?? (isRo ? "obiectul tău" : "your item");
  const itemB = swapContext?.resItem ?? (isRo ? "obiectul meu" : "my item");

  if (isRo) {
    return [
      {
        type: "open_negotiation",
        emoji: "🤝",
        label: "Deschis la negociere",
        text: `Mulțumesc pentru propunere! Sunt interesat de ${itemA}. Aș vrea să discutăm mai multe detalii despre starea obiectului și opțiunile de livrare. Ce zici?`,
      },
      {
        type: "accept",
        emoji: "✅",
        label: "Accept propunerea",
        text: `Super, accept schimbul! ${itemA} pentru ${itemB} mi se pare corect. Cum preferi să facem predarea — întâlnire sau curier?`,
      },
      {
        type: "counter_proposal",
        emoji: "💬",
        label: "Contra-propunere",
        text: `Apreciez interesul! Totuși, aș prefera o variantă ușor diferită. Ai fi deschis să ajustăm termenii schimbului? De exemplu, aș adăuga și un alt obiect pentru echitate.`,
      },
    ];
  }

  return [
    {
      type: "open_negotiation",
      emoji: "🤝",
      label: "Open to negotiation",
      text: `Thanks for the offer! I'm interested in ${itemA}. I'd like to discuss more details about the item's condition and delivery options. What do you think?`,
    },
    {
      type: "accept",
      emoji: "✅",
      label: "Accept proposal",
      text: `Great, I accept the swap! ${itemA} for ${itemB} sounds fair. How would you prefer to do the handover — meetup or courier?`,
    },
    {
      type: "counter_proposal",
      emoji: "💬",
      label: "Counter-proposal",
      text: `I appreciate the interest! However, I'd prefer a slightly different arrangement. Would you be open to adjusting the swap terms? For instance, I could add another item for fairness.`,
    },
  ];
}

/** Generate a swap checklist */
function generateChecklist(swapContext?: {
  reqItem?: string;
  resItem?: string;
  status?: string;
  logistics?: string;
  meetupPoint?: string;
}): Array<{ label: string; checked: boolean }> {
  const hasItems = !!(swapContext?.reqItem && swapContext?.resItem);
  const hasLogistics = !!swapContext?.logistics;
  const hasMeetup = !!swapContext?.meetupPoint;
  const isAccepted = swapContext?.status === "accepted" || swapContext?.status === "in_progress";

  return [
    { label: "Obiectele de schimb stabilite", checked: hasItems },
    { label: "Starea obiectelor verificată (poze + descriere)", checked: false },
    { label: "Ambele părți de acord cu schimbul", checked: isAccepted },
    { label: "Metodă de livrare aleasă (întâlnire / curier)", checked: hasLogistics },
    { label: "Punct de întâlnire sau adresă confirmate", checked: hasMeetup },
    { label: "Data și ora stabilite", checked: false },
    { label: "Escrow / garanție activată (opțional)", checked: false },
    { label: "Schimb finalizat și feedback acordat", checked: swapContext?.status === "completed" },
  ];
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed: ipAllowed } = rateLimit(ip, { limit: 60, windowMs: 60_000 });
  if (!ipAllowed) {
    return NextResponse.json({ status: "error", message: "Prea multe cereri." }, { status: 429 });
  }

  const log = requestLogger(request);
  const body = await request.json().catch(() => ({}));
  const { data: validated, error: validationError } = validateBody(body, aiChatAssistSchema);
  if (validationError) {
    log.warn("Validation failed", { error: validationError });
    return NextResponse.json({ status: "error", message: validationError }, { status: 400 });
  }

  const { message, action, conversationContext, swapContext, userId, userTier } = validated!;

  // Daily rate limit per tier
  const effectiveUserId = userId || ip;
  const effectiveTier = userTier || "free";
  const { allowed: dailyAllowed, used, limit } = checkDailyLimit(effectiveUserId, effectiveTier);
  if (!dailyAllowed) {
    return NextResponse.json({
      status: "error",
      message: "Ai atins limita zilnică de asistări AI.",
      code: "daily_limit_reached",
      used,
      limit,
    }, { status: 429 });
  }

  // Pre-send moderation check
  if (message) {
    const moderation = moderateMessage(message);
    if (!moderation.safe) {
      return NextResponse.json({
        status: "moderation",
        warning: moderation.warning,
        suggestion: moderation.suggestion,
        message: "Mesajul necesită atenție înainte de trimitere.",
      });
    }
  }

  incrementUsage(effectiveUserId);

  try {
    switch (action as ChatAssistAction) {
      case "rephrase_polite": {
        if (!message) {
          return NextResponse.json({ status: "error", message: "Mesajul este necesar." }, { status: 400 });
        }
        const rephrased = rephrasePolite(message);
        return NextResponse.json({ status: "ok", action, result: { rephrased } });
      }

      case "translate": {
        if (!message) {
          return NextResponse.json({ status: "error", message: "Mesajul este necesar." }, { status: 400 });
        }
        const detected = detectLanguage(message);
        const translation = translateMessage(message, detected);
        return NextResponse.json({ status: "ok", action, result: translation });
      }

      case "summarize_offer": {
        const summary = summarizeOffer(swapContext ?? {});
        return NextResponse.json({ status: "ok", action, result: { summary } });
      }

      case "generate_response": {
        const variants = generateResponse(message ?? "", conversationContext ?? [], swapContext);
        return NextResponse.json({ status: "ok", action, result: { variants } });
      }

      case "generate_checklist": {
        const checklist = generateChecklist(swapContext);
        return NextResponse.json({ status: "ok", action, result: { checklist } });
      }

      default:
        return NextResponse.json({ status: "error", message: "Acțiune necunoscută." }, { status: 400 });
    }
  } catch (err) {
    log.error("AI chat assist error", { error: String(err) });
    return NextResponse.json({ status: "error", message: "Eroare internă." }, { status: 500 });
  }
}
