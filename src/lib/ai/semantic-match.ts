import type { AIGateway } from "./gateway";
import type {
  MatchExplanationRequest,
  MatchExplanationResult,
  SemanticMatchProposal,
} from "./contracts";

export async function proposeSemanticMatchExplanation(
  gateway: AIGateway,
  request: MatchExplanationRequest,
): Promise<SemanticMatchProposal> {
  const result = await gateway.run<MatchExplanationRequest, MatchExplanationResult>({
    taskType: "match",
    input: request,
    locale: request.locale,
  });

  if (!result.output) {
    throw new Error(result.errorCode ?? "semantic_match_failed");
  }

  const baseScore = request.baseScore ?? 0;
  const adjustment = clamp(result.output.scoreAdjustment, -10, 10);
  const suggestedScore = clamp(Math.round(baseScore + adjustment), 0, 100);

  return {
    ...result.output,
    baseScore,
    suggestedScore,
    affectsRanking: false,
    requiresHumanConfirmation: true,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}