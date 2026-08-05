import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";
import {
  benchmarkTaskTypes,
  v1084BenchmarkCases,
  v1084BenchmarkManifest,
} from "@/lib/ai-benchmark/v1-08-4-dataset";
import {
  scoreBenchmarkCase,
  summarizeBenchmark,
  type BenchmarkProviderObservation,
} from "@/lib/ai-benchmark/v1-08-4-scorer";

describe("V1-08.4 AI benchmark dataset", () => {
  it("covers every supported locale with every required task", () => {
    expect(v1084BenchmarkManifest.localeCount).toBe(43);
    expect(v1084BenchmarkManifest.locales).toEqual([...locales]);
    expect(v1084BenchmarkManifest.taskTypes).toEqual([...benchmarkTaskTypes]);
    expect(v1084BenchmarkManifest.taskCountPerLocale).toBe(5);
    expect(v1084BenchmarkManifest.caseCount).toBe(215);

    for (const locale of locales) {
      const cases = v1084BenchmarkCases.filter((entry) => entry.locale === locale);
      expect(cases).toHaveLength(benchmarkTaskTypes.length);
      expect(new Set(cases.map((entry) => entry.taskType))).toEqual(
        new Set(benchmarkTaskTypes),
      );
    }
  });

  it("keeps all fixtures privacy-safe and provider execution unauthorised", () => {
    expect(v1084BenchmarkManifest.providerExecutionAuthorised).toBe(false);
    expect(v1084BenchmarkManifest.realCostAuthorised).toBe(false);

    for (const benchmarkCase of v1084BenchmarkCases) {
      expect(benchmarkCase.provenance.containsPersonalData).toBe(false);
      expect(benchmarkCase.provenance.source).toBe("synthetic_privacy_safe");
      expect(benchmarkCase.gold).toHaveProperty("humanConfirmationRequired");
    }
  });

  it("has unique stable IDs", () => {
    const ids = v1084BenchmarkCases.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("scores quality, schema, safety, provenance, cost, latency and human boundary", () => {
    const benchmarkCase = v1084BenchmarkCases.find(
      (entry) => entry.taskType === "match" && entry.locale === "en",
    );
    expect(benchmarkCase).toBeDefined();

    const observation: BenchmarkProviderObservation = {
      caseId: benchmarkCase!.id,
      output: {
        explanation: "Compatibility and distance are advisory; the user decision remains final.",
        finalDecision: false,
      },
      latencyMs: 120,
      estimatedCostUsd: 0.002,
      provider: "test-provider",
      model: "test-model",
      fallbackUsed: false,
      schemaValid: true,
      humanConfirmationExposed: true,
    };

    const score = scoreBenchmarkCase(benchmarkCase!, observation);
    expect(score.passed).toBe(true);
    expect(score.qualityScore).toBeGreaterThanOrEqual(0.7);
    expect(score.schemaScore).toBe(1);
    expect(score.safetyScore).toBe(1);
    expect(score.provenanceScore).toBe(1);
    expect(score.humanBoundaryScore).toBe(1);
    expect(score.latencyMs).toBe(120);
    expect(score.estimatedCostUsd).toBe(0.002);

    expect(summarizeBenchmark([score])).toEqual({
      caseCount: 1,
      passedCount: 1,
      failedCount: 0,
      meanQualityScore: score.qualityScore,
      schemaPassRate: 1,
      safetyPassRate: 1,
      humanBoundaryPassRate: 1,
      totalEstimatedCostUsd: 0.002,
      meanLatencyMs: 120,
    });
  });
});
