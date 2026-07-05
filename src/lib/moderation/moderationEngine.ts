export type ModerationCategory =
  | "safe"
  | "spam"
  | "toxicity"
  | "scam"
  | "off_platform"
  | "duplicate"
  | "suspicious";

export type ModerationResult = {
  category: ModerationCategory;
  risk_score: number;
  flags: string[];
  recommended_action:
    | "allow"
    | "warn"
    | "shadow_limit"
    | "block"
    | "manual_review";
};

const SCAM_PATTERNS = [
  /western union/i,
  /crypto/i,
  /gift card/i,
  /telegram only/i,
  /send money/i,
  /advance payment/i,
  /bank transfer/i,
  /outside swaply/i,
];

const TOXIC_PATTERNS = [
  /idiot/i,
  /stupid/i,
  /moron/i,
  /hate/i,
  /kill yourself/i,
];

const SPAM_PATTERNS = [
  /(.)\1{8,}/i,
  /free money/i,
  /click here/i,
  /buy now/i,
  /http[s]?:\/\//i,
];

const OFF_PLATFORM_PATTERNS = [
  /whatsapp/i,
  /signal/i,
  /telegram/i,
  /viber/i,
  /instagram/i,
  /facebook/i,
  /gmail\.com/i,
  /@yahoo/i,
  /phone number/i,
];

function scorePatterns(text: string, patterns: RegExp[]): number {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

export function moderateText(text: string): ModerationResult {
  const normalized = text.trim().toLowerCase();

  const scamHits = scorePatterns(normalized, SCAM_PATTERNS);
  const toxicHits = scorePatterns(normalized, TOXIC_PATTERNS);
  const spamHits = scorePatterns(normalized, SPAM_PATTERNS);
  const offPlatformHits = scorePatterns(normalized, OFF_PLATFORM_PATTERNS);

  const flags: string[] = [];
  let category: ModerationCategory = "safe";
  let risk = 0;
  let action: ModerationResult["recommended_action"] = "allow";

  if (spamHits > 0) {
    category = "spam";
    risk += spamHits * 18;
    flags.push("spam_detected");
  }

  if (toxicHits > 0) {
    category = "toxicity";
    risk += toxicHits * 22;
    flags.push("toxicity_detected");
  }

  if (offPlatformHits > 0) {
    category = "off_platform";
    risk += offPlatformHits * 14;
    flags.push("off_platform_contact_attempt");
  }

  if (scamHits > 0) {
    category = "scam";
    risk += scamHits * 28;
    flags.push("potential_scam");
  }

  if (normalized.length > 1500) {
    risk += 10;
    flags.push("unusually_long_message");
  }

  if (risk >= 70) {
    action = "block";
  } else if (risk >= 50) {
    action = "manual_review";
  } else if (risk >= 30) {
    action = "shadow_limit";
  } else if (risk >= 15) {
    action = "warn";
  }

  return {
    category,
    risk_score: Math.min(100, risk),
    flags,
    recommended_action: action,
  };
}

export function calculateUserRisk(
  params: {
    trust_score?: number | null;
    reports?: number | null;
    completion_rate?: number | null;
    rating?: number | null;
  },
): number {
  let risk = 0;

  if ((params.trust_score ?? 100) < 40) risk += 25;
  if ((params.completion_rate ?? 100) < 60) risk += 20;
  if ((params.rating ?? 5) < 3) risk += 15;
  if ((params.reports ?? 0) >= 3) risk += 30;

  return Math.min(100, risk);
}
