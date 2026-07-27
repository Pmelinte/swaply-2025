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

export async function proposeMessageModeration(
  gateway: AIGateway,
  text: string,
): Promise<SafetyModerationProposal> {
  const normalizedText = text.trim();
  if (!normalizedText) return emptyProposal();

  const deterministic = moderateText(normalizedText);
  const deterministicAction = normalizeAction(deterministic.recommended_action);

  // High-risk deterministic findings remain server-authoritative and are not
  // sent to an external provider. This reduces data exposure and cost.
  if (deterministicAction === "block" || deterministicAction === "manual_review") {
    return buildProposal({
      category: deterministic.category,
      riskScore: deterministic.risk_score,
      flags: deterministic.flags,
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
  const flags = Array.from(new Set([...deterministic.flags, ...providerFlags]));
  const providerRisk = provider?.safe === false ? Math.max(50, providerFlags.length * 20) : providerFlags.length * 15;
  const riskScore = Math.min(100, Math.max(deterministic.risk_score, providerRisk));
  const action = strongerAction(deterministicAction, actionForRisk(riskScore));

  return buildProposal({
    category: deterministic.category === "safe" && flags.length > 0 ? "suspicious" : deterministic.category,
    riskScore,
    flags,
    action,
    source: gatewayResult.status === "ok" || gatewayResult.status === "provider_fallback"
      ? "ai_assisted"
      : "deterministic",
    message: provider?.message,
  });
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
    message: input.message ?? (input.flags.length > 0 ? `Mesaj semnalat: ${input.flags.join(", ")}` : undefined),
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
