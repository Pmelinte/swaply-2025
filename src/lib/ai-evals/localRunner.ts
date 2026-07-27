import { AIGateway } from "@/lib/ai/gateway";
import type { AITaskType } from "@/lib/ai/taskTypes";

export interface AIEvalCase {
  name: string;
  taskType: AITaskType;
  input: unknown;
  locale: string;
  maxLatencyMs?: number;
  maxEstimatedCost?: number;
  expectFallback?: boolean;
  validateOutput?: (output: unknown) => boolean;
}

export interface AIEvalResult {
  name: string;
  taskType: AITaskType;
  schemaCorrect: boolean;
  fallbackCorrect: boolean;
  localeCovered: boolean;
  latencyWithinBudget: boolean;
  costWithinBudget: boolean;
  latencyMs: number;
  estimatedCost: number;
  status: string;
  errorCode?: string;
  passed: boolean;
}

export interface AIEvalSummary {
  total: number;
  passed: number;
  failed: number;
  passRate: number;
  averageLatencyMs: number;
  maximumLatencyMs: number;
  totalEstimatedCost: number;
  contractFailures: number;
  fallbackFailures: number;
  latencyFailures: number;
  costFailures: number;
}

export interface AIEvalGate {
  minimumPassRate: number;
  maximumAverageLatencyMs: number;
  maximumTotalEstimatedCost: number;
}

export const DEFAULT_AI_EVAL_GATE: AIEvalGate = {
  minimumPassRate: 1,
  maximumAverageLatencyMs: 500,
  maximumTotalEstimatedCost: 0,
};

export async function runLocalAIEvals(cases: AIEvalCase[]): Promise<AIEvalResult[]> {
  const gateway = new AIGateway({ providers: [] });

  return Promise.all(cases.map(async (testCase) => {
    const result = await gateway.run({
      taskType: testCase.taskType,
      input: testCase.input,
      locale: testCase.locale,
    });
    const estimatedCost = result.estimatedCost ?? 0;
    const schemaCorrect = testCase.validateOutput
      ? testCase.validateOutput(result.output)
      : result.output !== undefined;
    const fallbackCorrect = testCase.expectFallback === false
      ? result.status !== "non_ai_fallback"
      : result.status === "non_ai_fallback";
    const localeCovered = Boolean(testCase.locale.trim());
    const latencyWithinBudget = result.latencyMs <= (testCase.maxLatencyMs ?? 500);
    const costWithinBudget = estimatedCost <= (testCase.maxEstimatedCost ?? 0);
    const passed = schemaCorrect
      && fallbackCorrect
      && localeCovered
      && latencyWithinBudget
      && costWithinBudget;

    return {
      name: testCase.name,
      taskType: testCase.taskType,
      schemaCorrect,
      fallbackCorrect,
      localeCovered,
      latencyWithinBudget,
      costWithinBudget,
      latencyMs: result.latencyMs,
      estimatedCost,
      status: result.status,
      errorCode: result.errorCode,
      passed,
    };
  }));
}

export function summarizeLocalAIEvals(results: readonly AIEvalResult[]): AIEvalSummary {
  const passed = results.filter((result) => result.passed).length;
  const totalLatency = results.reduce((sum, result) => sum + result.latencyMs, 0);
  const maximumLatencyMs = results.reduce((maximum, result) => Math.max(maximum, result.latencyMs), 0);
  const totalEstimatedCost = results.reduce((sum, result) => sum + result.estimatedCost, 0);

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length ? passed / results.length : 1,
    averageLatencyMs: results.length ? round(totalLatency / results.length) : 0,
    maximumLatencyMs: round(maximumLatencyMs),
    totalEstimatedCost: round(totalEstimatedCost, 8),
    contractFailures: results.filter((result) => !result.schemaCorrect).length,
    fallbackFailures: results.filter((result) => !result.fallbackCorrect).length,
    latencyFailures: results.filter((result) => !result.latencyWithinBudget).length,
    costFailures: results.filter((result) => !result.costWithinBudget).length,
  };
}

export function passesAIEvalGate(
  summary: AIEvalSummary,
  gate: AIEvalGate = DEFAULT_AI_EVAL_GATE,
): boolean {
  return summary.passRate >= gate.minimumPassRate
    && summary.averageLatencyMs <= gate.maximumAverageLatencyMs
    && summary.totalEstimatedCost <= gate.maximumTotalEstimatedCost
    && summary.contractFailures === 0
    && summary.fallbackFailures === 0
    && summary.latencyFailures === 0
    && summary.costFailures === 0;
}

function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
