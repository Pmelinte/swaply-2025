import { AIGateway } from "@/lib/ai/gateway";

export interface AIEvalCase {
  name: string;
  taskType: "classify_item" | "moderate_chat";
  input: unknown;
  locale: string;
}

export interface AIEvalResult {
  name: string;
  schemaCorrect: boolean;
  fallbackCorrect: boolean;
  localeCovered: boolean;
  latencyMs: number;
  estimatedCost: number;
}

export interface AIEvalSummary {
  total: number;
  passed: number;
  failed: number;
  averageLatencyMs: number;
  totalEstimatedCost: number;
}

export async function runLocalAIEvals(cases: AIEvalCase[]): Promise<AIEvalResult[]> {
  const gateway = new AIGateway({ providers: [] });
  return Promise.all(cases.map(async (testCase) => {
    const result = await gateway.run({ taskType: testCase.taskType, input: testCase.input, locale: testCase.locale });
    return {
      name: testCase.name,
      schemaCorrect: result.output !== undefined,
      fallbackCorrect: result.status === "non_ai_fallback",
      localeCovered: Boolean(testCase.locale),
      latencyMs: result.latencyMs,
      estimatedCost: result.estimatedCost ?? 0,
    };
  }));
}

export function summarizeLocalAIEvals(results: readonly AIEvalResult[]): AIEvalSummary {
  const passed = results.filter((result) => result.schemaCorrect && result.fallbackCorrect && result.localeCovered).length;
  const totalLatency = results.reduce((sum, result) => sum + result.latencyMs, 0);
  const totalEstimatedCost = results.reduce((sum, result) => sum + result.estimatedCost, 0);
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    averageLatencyMs: results.length ? Math.round((totalLatency / results.length) * 100) / 100 : 0,
    totalEstimatedCost: Math.round(totalEstimatedCost * 100_000_000) / 100_000_000,
  };
}
