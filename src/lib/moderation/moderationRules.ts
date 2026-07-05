export type ModerationRiskType =
  | "scam"
  | "off_platform_payment"
  | "personal_data"
  | "toxicity"
  | "pressure"
  | "suspicious_link";

export type ModerationRisk = {
  type: ModerationRiskType;
  severity: "low" | "medium" | "high";
  reason: string;
};

export type ModerationResult = {
  allowed: boolean;
  score: number;
  risks: ModerationRisk[];
};

const RISK_PATTERNS: Array<{
  type: ModerationRiskType;
  severity: ModerationRisk["severity"];
  reason: string;
  patterns: RegExp[];
}> = [
  {
    type: "off_platform_payment",
    severity: "high",
    reason: "Message may be trying to move payment outside Swaply.",
    patterns: [/\bwestern union\b/i, /\brevolut\b/i, /\bcrypto\b/i, /\bbinance\b/i, /\biban\b/i],
  },
  {
    type: "suspicious_link",
    severity: "medium",
    reason: "Message contains a link that should be reviewed.",
    patterns: [/https?:\/\//i, /\bbit\.ly\b/i, /\btinyurl\b/i, /\bt\.me\//i],
  },
  {
    type: "pressure",
    severity: "medium",
    reason: "Message may apply pressure to rush a decision.",
    patterns: [/urgent/i, /acum sau niciodată/i, /today only/i, /doar azi/i, /grăbește/i],
  },
  {
    type: "personal_data",
    severity: "medium",
    reason: "Message may include personal contact data.",
    patterns: [/\b\+?\d{10,14}\b/i, /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  },
  {
    type: "toxicity",
    severity: "medium",
    reason: "Message contains hostile language.",
    patterns: [/idiot/i, /prost/i, /fraier/i, /fuck/i, /shit/i],
  },
  {
    type: "scam",
    severity: "high",
    reason: "Message contains common scam-like wording.",
    patterns: [/advance fee/i, /plătește înainte/i, /gift card/i, /cod de verificare/i, /verification code/i],
  },
];

function severityWeight(severity: ModerationRisk["severity"]): number {
  if (severity === "high") return 45;
  if (severity === "medium") return 25;
  return 10;
}

export function moderateText(text: string): ModerationResult {
  const risks: ModerationRisk[] = [];
  const normalized = text.trim();

  if (!normalized) {
    return { allowed: false, score: 100, risks: [{ type: "toxicity", severity: "low", reason: "Empty message." }] };
  }

  for (const rule of RISK_PATTERNS) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      risks.push({ type: rule.type, severity: rule.severity, reason: rule.reason });
    }
  }

  const score = Math.min(100, risks.reduce((sum, risk) => sum + severityWeight(risk.severity), 0));
  return {
    allowed: !risks.some((risk) => risk.severity === "high") && score < 70,
    score,
    risks,
  };
}
