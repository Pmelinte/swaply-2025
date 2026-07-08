import { describe, expect, it } from "vitest";
import {
  calculateAIEvalTotalScore,
  canAIOverrideHumanDecision,
  evaluateAIOutput,
  shouldExposeRawEvalToPublic,
  shouldUseFallback,
} from "@/lib/ai-evals/aiEvalPolicy";
import { AI_EVAL_CASE_EXAMPLES, AI_EVAL_SCORECARD_EXAMPLES } from "@/lib/ai-evals/aiEvalSeeds";
import { AI_EVAL_TASKS, DEFAULT_AI_EVAL_THRESHOLDS } from "@/lib/ai-evals/aiEvalTypes";

describe("AI evaluation policy", () => {
  it("defines the expected AI evaluation tasks and thresholds", () => {
    expect(AI_EVAL_TASKS).toEqual([
      "item_classification",
      "item_description",
      "matching_explanation",
      "photo_discovery",
      "chat_summary",
      "exchange_guidance",
      "story_prompt",
      "translation",
    ]);

    expect(DEFAULT_AI_EVAL_THRESHOLDS.passScore).toBe(80);
    expect(DEFAULT_AI_EVAL_THRESHOLDS.minimumSafety).toBe(75);
    expect(DEFAULT_AI_EVAL_THRESHOLDS.minimumPrivacy).toBe(75);
  });

  it("calculates a weighted AI eval score", () => {
    expect(calculateAIEvalTotalScore(AI_EVAL_SCORECARD_EXAMPLES.pass)).toBe(91);
  });

  it("passes high quality low-risk outputs", () => {
    const result = evaluateAIOutput({
      evalCase: AI_EVAL_CASE_EXAMPLES[0],
      scorecard: AI_EVAL_SCORECARD_EXAMPLES.pass,
    });

    expect(result.verdict).toBe("pass");
    expect(result.requiresHumanReview).toBe(false);
    expect(result.advisoryOnly).toBe(true);
    expect(shouldUseFallback(result)).toBe(false);
  });

  it("warns on medium score and requires human review", () => {
    const result = evaluateAIOutput({
      evalCase: AI_EVAL_CASE_EXAMPLES[1],
      scorecard: AI_EVAL_SCORECARD_EXAMPLES.warn,
    });

    expect(result.verdict).toBe("warn");
    expect(result.requiresHumanReview).toBe(true);
  });

  it("fails when safety is below threshold", () => {
    const result = evaluateAIOutput({
      evalCase: AI_EVAL_CASE_EXAMPLES[1],
      scorecard: AI_EVAL_SCORECARD_EXAMPLES.failSafety,
    });

    expect(result.verdict).toBe("fail");
    expect(result.reasons.join(" ")).toContain("Safety score");
    expect(shouldUseFallback(result)).toBe(true);
  });

  it("uses fallback when fallback readiness is too low", () => {
    const result = evaluateAIOutput({
      evalCase: AI_EVAL_CASE_EXAMPLES[0],
      scorecard: AI_EVAL_SCORECARD_EXAMPLES.failFallback,
    });

    expect(result.verdict).toBe("pass");
    expect(shouldUseFallback(result)).toBe(true);
  });

  it("requires human review for high risk tasks even with high scores", () => {
    const result = evaluateAIOutput({
      evalCase: AI_EVAL_CASE_EXAMPLES[2],
      scorecard: AI_EVAL_SCORECARD_EXAMPLES.pass,
    });

    expect(result.verdict).toBe("pass");
    expect(result.requiresHumanReview).toBe(true);
  });

  it("never lets AI override users or exposes raw evals publicly", () => {
    expect(canAIOverrideHumanDecision()).toBe(false);
    expect(shouldExposeRawEvalToPublic()).toBe(false);
  });
});
