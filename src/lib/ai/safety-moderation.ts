import type { AIGateway } from "./gateway";
import { moderateText, type ModerationCategory } from "@/lib/moderation/moderationEngine";

export type SafetyModerationAction = "allow" | "warn" | "manual_review" | "block";

export interface SafetyModerationProposal {
  safe: boolean;
  flags: string[];
  message?: string;
  category: ModerationCategory;
  riskScore: number;
  recommendedAction: SafetyModerationAction;
  source: "deterministic" | "ai_assisted";
  requiresHumanReview: boolean;
  automaticEnforcement: false;
}

interface ProviderModerationOutput {
  safe?: boolean;
  flags?: string[];
  message?: string;
}

const PERSONAL_DATA_PATTERNS = [
  /\b\d{10,}\b/,
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /\bIBAN\b/i,
  /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b/,
];

const PROFANITY = [
  "prost", "idiot", "cretin", "imbecil", "tampit", "fraier", "suge", "futu", "cacat", "rahat", "curva", "tarfa",
  "fuck", "shit", "ass", "bitch", "damn", "stupid", "moron",
  "mierda", "puta", "joder", "idiota", "estupido", "culo", "cabron",
];

export async function proposeMessageModeration(
  gateway: AIGateway,
  text: string,
): Promise<SafetyModerationProposal> {
  const normalizedText = text.trim();
  if (!normalizedText) return emptyProposal();

  const deterministic = moderateText(normalizedText);
  const legacyFlags = detectLegacyFlags(normalizedText);
  const deterministicFlags = Array.from(new Set([...deterministic.flags, ...legacyFlags]));
  const hasLegacyBlock = legacyFlags.length > 0;
  const deterministicRisk = Math.max(deterministic.risk_score, hasLegacyBlock ? 50 : 0);
  const deterministicAction = strongerAction(
    normalizeAction(deterministic.recommended_action),
    hasLegacyBlock ? "manual_review" : "allow",
  );

  // High-risk deterministic findings remain server-authoritative and are not
  // sent to an external provider. This reduces data exposure and cost.
  if (deterministicAction === "block" || deterministicAction === "manual_review") {
    return buildProposal({
      category: categoryForFlags(deterministic.category, deterministicFlags),
      riskScore: deterministicRisk,
      flags: deterministicFlags,
      action: deterministicAction,
      source: "deterministic",
    });
  }

  const gatewayResult = await gateway.run<{ text: string }, ProviderModerationOutput>({
    taskType: "moderate_chat",
    input: { text: normalizedText },
  });
  const provider = gatewayResult.output;
  const providerFlags = provider?.flags ?? [];
  const flags = Array.from(new Set([...deterministicFlags, ...providerFlags]));
  const providerRisk = provider?.safe === false ? Math.max(50, providerFlags.length * 20) : providerFlags.length * 15;
  const riskScore = Math.min(100, Math.max(deterministicRisk, providerRisk));
  const action = strongerAction(deterministicAction, actionForRisk(riskScore));

  return buildProposal({
    category: categoryForFlags(deterministic.category, flags),
    riskScore,
    flags,
    action,
    source: gatewayResult.status === "ok" || gatewayResult.status === "provider_fallback"
      ? "ai_assisted"
      : "deterministic",
    message: provider?.message,
  });
}

function detectLegacyFlags(text: string): string[] {
  const flags: string[] = [];
  const lower = text.toLowerCase();

  if (PERSONAL_DATA_PATTERNS.some((pattern) => pattern.test(text))) flags.push("date_personale");
  if (PROFANITY.some((word) => lower.includes(word))) flags.push("limbaj_inadecvat");
  if (text.length > 500) flags.push("mesaj_prea_lung");
  if (/(.)\1{5,}/.test(text)) flags.push("spam_caractere");
  if ((text.match(/https?:\/\//g) || []).length > 2) flags.push("spam_linkuri");

  return flags;
}

function categoryForFlags(category: ModerationCategory, flags: string[]): ModerationCategory {
  if (category !== "safe") return category;
  if (flags.includes("limbaj_inadecvat")) return "toxicity";
  if (flags.some((flag) => flag.startsWith("spam_") || flag === "mesaj_prea_lung")) return "spam";
  return flags.length > 0 ? "suspicious" : "safe";
}

function emptyProposal(): SafetyModerationProposal {
  return {
    safe: true,
    flags: [],
    category: "safe",
    riskScore: 0,
    recommendedAction: "allow",
    source: "deterministic",
    requiresHumanReview: false,
    automaticEnforcement: false,
  };
}

function buildProposal(input: {
  category: ModerationCategory;
  riskScore: number;
  flags: string[];
  action: SafetyModerationAction;
  source: SafetyModerationProposal["source"];
  message?: string;
}): SafetyModerationProposal {
  const safe = input.action === "allow" || input.action === "warn";
  return {
    safe,
    flags: input.flags,
    message: input.message ?? (input.flags.length > 0 ? `Mesaj blocat: ${input.flags.join(", ")}` : undefined),
    category: input.category,
    riskScore: Math.min(100, Math.max(0, Math.round(input.riskScore))),
    recommendedAction: input.action,
    source: input.source,
    requiresHumanReview: input.action === "manual_review" || input.action === "block",
    automaticEnforcement: false,
  };
}

function normalizeAction(action: string): SafetyModerationAction {
  if (action === "block" || action === "manual_review" || action === "warn") return action;
  if (action === "shadow_limit") return "warn";
  return "allow";
}

function actionForRisk(riskScore: number): SafetyModerationAction {
  if (riskScore >= 70) return "block";
  if (riskScore >= 50) return "manual_review";
  if (riskScore >= 15) return "warn";
  return "allow";
}

function strongerAction(a: SafetyModerationAction, b: SafetyModerationAction): SafetyModerationAction {
  const rank: Record<SafetyModerationAction, number> = { allow: 0, warn: 1, manual_review: 2, block: 3 };
  return rank[a] >= rank[b] ? a : b;
}
