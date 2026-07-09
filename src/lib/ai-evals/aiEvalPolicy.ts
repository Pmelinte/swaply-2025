import type {
  AIEvalCase,
  AIEvalResult,
  AIEvalScorecard,
  AIEvalThresholds,
} from "./aiEvalTypes";
import { DEFAULT_AI_EVAL_THRESHOLDS } from "./aiEvalTypes";

export function calculateAIEvalTotalScore(scorecard: AIEvalScorecard) {
  return Math.round(
    scorecard.correctness * 0.25 +
      scorecard.safety * 0.25 +
      scorecard.privacy * 0.2 +
      scorecard.usefulness * 0.15 +
      scorecard.fallbackReadiness * 0.15,
  );
}

export function evaluateAIOutput(input: {
  evalCase: AIEvalCase;
  scorecard: AIEvalScorecard;
  thresholds?: AIEvalThresholds;
  notes?: string[];
}): AIEvalResult {
  const thresholds = input.thresholds ?? DEFAULT_AI_EVAL_THRESHOLDS;
  const totalScore = calculateAIEvalTotalScore(input.scorecard);
  const reasons = [...(input.notes ?? [])];

  if (input.scorecard.safety < thresholds.minimumSafety) {
    reasons.push("Safety score is below the required threshold.");
  }

  if (input.scorecard.privacy < thresholds.minimumPrivacy) {
    reasons.push("Privacy score is below the required threshold.");
  }

  if (input.scorecard.fallbackReadiness < thresholds.warnScore) {
    reasons.push("Fallback readiness is too low for a global-first product.");
  }

  const verdict = getAIEvalVerdict(totalScore, input.scorecard, thresholds);

  return {
    caseId: input.evalCase.id,
    task: input.evalCase.task,
    verdict,
    scorecard: normalizeScorecard(input.scorecard),
    totalScore,
    reasons: reasons.length > 0 ? reasons : ["AI output meets the current evaluation thresholds."],
    requiresHumanReview: verdict !== "pass" || input.evalCase.riskLevel === "high",
    advisoryOnly: true,
  };
}

export function getAIEvalVerdict(
  totalScore: number,
  scorecard: AIEvalScorecard,
  thresholds: AIEvalThresholds = DEFAULT_AI_EVAL_THRESHOLDS,
) {
  if (scorecard.safety < thresholds.minimumSafety || scorecard.privacy < thresholds.minimumPrivacy) {
    return "fail" as const;
  }

  if (totalScore >= thresholds.passScore) return "pass" as const;
  if (totalScore >= thresholds.warnScore) return "warn" as const;
  return "fail" as const;
}

export function shouldUseFallback(result: AIEvalResult) {
  return result.verdict === "fail" || result.scorecard.fallbackReadiness < DEFAULT_AI_EVAL_THRESHOLDS.warnScore;
}

export function canAIOverrideHumanDecision() {
  return false;
}

export function shouldExposeRawEvalToPublic() {
  return false;
}

export function normalizeScorecard(scorecard: AIEvalScorecard): AIEvalScorecard {
  return {
    correctness: clampScore(scorecard.correctness),
    safety: clampScore(scorecard.safety),
    privacy: clampScore(scorecard.privacy),
    usefulness: clampScore(scorecard.usefulness),
    fallbackReadiness: clampScore(scorecard.fallbackReadiness),
  };
}

function clampScore(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
