import { describe, expect, it } from "vitest";
import {
  passesAIEvalGate,
  runLocalAIEvals,
  summarizeLocalAIEvals,
  type AIEvalResult,
} from "@/lib/ai-evals/localRunner";

describe("E2.5 AI evaluation and regression gates", () => {
  it("evaluates the four E2 task contracts with zero-cost fallbacks", async () => {
    const results = await runLocalAIEvals([
      {
        name: "classify",
        taskType: "classify_item",
        input: { titleHint: "camera" },
        locale: "en",
      },
      {
        name: "translate",
        taskType: "translate",
        input: { text: "Salut", sourceLocale: "ro", targetLocale: "en" },
        locale: "ro",
      },
      {
        name: "match",
        taskType: "match",
        input: {
          offeredItem: { title: "Camera" },
          requestedItem: { title: "Tripod" },
          baseScore: 60,
        },
        locale: "en",
      },
      {
        name: "moderate",
        taskType: "moderate_chat",
        input: { text: "Hello" },
        locale: "en",
      },
    ]);

    expect(results).toHaveLength(4);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results.every((result) => result.estimatedCost === 0)).toBe(true);
  });

  it("fails the gate when a contract, fallback, latency or cost budget regresses", () => {
    const result: AIEvalResult = {
      name: "regression",
      taskType: "translate",
      schemaCorrect: false,
      fallbackCorrect: false,
      localeCovered: true,
      latencyWithinBudget: false,
      costWithinBudget: false,
      latencyMs: 900,
      estimatedCost: 0.01,
      status: "error",
      passed: false,
    };

    const summary = summarizeLocalAIEvals([result]);

    expect(summary.failed).toBe(1);
    expect(summary.contractFailures).toBe(1);
    expect(summary.fallbackFailures).toBe(1);
    expect(summary.latencyFailures).toBe(1);
    expect(summary.costFailures).toBe(1);
    expect(passesAIEvalGate(summary)).toBe(false);
  });

  it("passes only a complete zero-cost regression suite", () => {
    const result: AIEvalResult = {
      name: "stable",
      taskType: "moderate_chat",
      schemaCorrect: true,
      fallbackCorrect: true,
      localeCovered: true,
      latencyWithinBudget: true,
      costWithinBudget: true,
      latencyMs: 10,
      estimatedCost: 0,
      status: "non_ai_fallback",
      passed: true,
    };

    expect(passesAIEvalGate(summarizeLocalAIEvals([result]))).toBe(true);
  });
});
