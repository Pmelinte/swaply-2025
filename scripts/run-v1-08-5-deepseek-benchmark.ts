import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import {
  v1084BenchmarkCases,
  v1084BenchmarkManifest,
  type BenchmarkCase,
} from "../src/lib/ai-benchmark/v1-08-4-dataset";
import {
  scoreBenchmarkCase,
  summarizeBenchmark,
  type BenchmarkProviderObservation,
} from "../src/lib/ai-benchmark/v1-08-4-scorer";

const API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-flash";
const INPUT_USD_PER_MILLION = 0.14;
const OUTPUT_USD_PER_MILLION = 0.28;
const MAX_OUTPUT_TOKENS = 320;
const DEFAULT_BUDGET_USD = 5;
const OUTPUT_DIR = "artifacts/v1-08-5";
const RETRY_DELAYS_MS = [1_000, 3_000, 8_000];

type DeepSeekUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: DeepSeekUsage;
  error?: { message?: string };
};

type ModelPayload = {
  normalizedConcepts: string[];
  l1Category?: string;
  l2Category?: string;
  moderationLabel?: "safe" | "review" | "unsafe";
  finalDecision?: boolean;
  originalText?: string;
  localizedOutput?: string;
  humanConfirmationExposed?: boolean;
};

type CaseEvidence = {
  caseId: string;
  locale: string;
  taskType: string;
  status: "completed" | "failed" | "budget_stopped";
  provider: "deepseek";
  model: typeof MODEL;
  visualInputSupported: false;
  classificationModality: "text_hints_only" | "not_applicable";
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  response?: ModelPayload;
  score?: ReturnType<typeof scoreBenchmarkCase>;
  error?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parseBudget(): number {
  const raw = process.env.V1085_MAX_BUDGET_USD?.trim();
  const budget = raw ? Number(raw) : DEFAULT_BUDGET_USD;
  if (!Number.isFinite(budget) || budget <= 0 || budget > 5) {
    throw new Error("V1085_MAX_BUDGET_USD must be greater than 0 and no more than 5");
  }
  return budget;
}

function calculateCost(usage: DeepSeekUsage): number {
  const input = usage.prompt_tokens ?? 0;
  const output = usage.completion_tokens ?? 0;
  return (input / 1_000_000) * INPUT_USD_PER_MILLION
    + (output / 1_000_000) * OUTPUT_USD_PER_MILLION;
}

function conservativeNextCallReserveUsd(): number {
  const assumedInputTokens = 2_000;
  return (assumedInputTokens / 1_000_000) * INPUT_USD_PER_MILLION
    + (MAX_OUTPUT_TOKENS / 1_000_000) * OUTPUT_USD_PER_MILLION;
}

function promptFor(benchmarkCase: BenchmarkCase): string {
  return JSON.stringify({
    instruction: [
      "Evaluate the Swaply benchmark case and return JSON only.",
      "Write localizedOutput in targetLocale.",
      "normalizedConcepts must use the canonical English concepts present in the case gold label when semantically supported.",
      "Never invent image observations: imageFixture is only an identifier and no image bytes are provided.",
      "Do not make a final user decision. Preserve source text for translation tasks.",
    ].join(" "),
    targetLocale: benchmarkCase.locale,
    taskType: benchmarkCase.taskType,
    input: benchmarkCase.input,
    expectedJsonShape: {
      normalizedConcepts: ["canonical concept"],
      l1Category: "optional canonical L1",
      l2Category: "optional canonical L2",
      moderationLabel: "safe | review | unsafe when applicable",
      finalDecision: false,
      originalText: "source text when applicable",
      localizedOutput: "answer in target locale",
      humanConfirmationExposed: true,
    },
  });
}

function parsePayload(content: string): ModelPayload {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(trimmed) as Partial<ModelPayload>;
  if (!Array.isArray(parsed.normalizedConcepts)) {
    throw new Error("Response lacks normalizedConcepts array");
  }
  return {
    ...parsed,
    normalizedConcepts: parsed.normalizedConcepts.filter(
      (value): value is string => typeof value === "string",
    ),
  };
}

async function callDeepSeek(apiKey: string, benchmarkCase: BenchmarkCase) {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    const started = performance.now();
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "You are a deterministic multilingual evaluation engine. Return valid JSON only.",
            },
            { role: "user", content: promptFor(benchmarkCase) },
          ],
          thinking: { type: "disabled" },
          response_format: { type: "json_object" },
          max_tokens: MAX_OUTPUT_TOKENS,
          temperature: 0,
          stream: false,
        }),
      });
      const latencyMs = Math.round(performance.now() - started);
      const body = (await response.json()) as DeepSeekResponse;
      if (!response.ok) {
        throw new Error(`DeepSeek ${response.status}: ${body.error?.message ?? "unknown error"}`);
      }
      const content = body.choices?.[0]?.message?.content;
      if (!content) throw new Error("DeepSeek returned no message content");
      return { payload: parsePayload(content), usage: body.usage ?? {}, latencyMs };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      }
    }
  }
  throw lastError ?? new Error("DeepSeek request failed");
}

async function persist(results: CaseEvidence[], budgetUsd: number) {
  const completedScores = results.flatMap((entry) => (entry.score ? [entry.score] : []));
  const spentUsd = results.reduce((sum, entry) => sum + (entry.costUsd ?? 0), 0);
  const evidence = {
    generatedAt: new Date().toISOString(),
    provider: "deepseek",
    model: MODEL,
    modelMode: "non-thinking",
    datasetVersion: v1084BenchmarkManifest.version,
    localeCount: v1084BenchmarkManifest.localeCount,
    plannedCaseCount: v1084BenchmarkManifest.caseCount,
    completedCaseCount: results.filter((entry) => entry.status === "completed").length,
    failedCaseCount: results.filter((entry) => entry.status === "failed").length,
    budgetStoppedCount: results.filter((entry) => entry.status === "budget_stopped").length,
    budgetUsd,
    spentUsd,
    withinBudget: spentUsd <= budgetUsd,
    visualInputSupported: false,
    visualClassificationEvidence: "NOT_PROVEN",
    classificationModality: "text_hints_only",
    scoreSummary: summarizeBenchmark(completedScores),
    results,
  };
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(`${OUTPUT_DIR}/deepseek-v4-flash-results.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

async function main() {
  const apiKey = requiredEnv("DEEPSEEK_API_KEY");
  const budgetUsd = parseBudget();
  const reserveUsd = conservativeNextCallReserveUsd();
  const results: CaseEvidence[] = [];
  let spentUsd = 0;

  for (const benchmarkCase of v1084BenchmarkCases) {
    if (spentUsd + reserveUsd > budgetUsd) {
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        taskType: benchmarkCase.taskType,
        status: "budget_stopped",
        provider: "deepseek",
        model: MODEL,
        visualInputSupported: false,
        classificationModality: benchmarkCase.taskType === "classify_item" ? "text_hints_only" : "not_applicable",
        error: "Stopped before request because the conservative budget reserve would exceed the approved cap",
      });
      continue;
    }

    try {
      const { payload, usage, latencyMs } = await callDeepSeek(apiKey, benchmarkCase);
      const costUsd = calculateCost(usage);
      spentUsd += costUsd;
      const observation: BenchmarkProviderObservation = {
        caseId: benchmarkCase.id,
        output: {
          ...payload,
          finalDecision: payload.finalDecision ?? false,
          moderationLabel: payload.moderationLabel,
        },
        normalizedConcepts: payload.normalizedConcepts,
        l1Category: payload.l1Category,
        l2Category: payload.l2Category,
        latencyMs,
        estimatedCostUsd: costUsd,
        provider: "deepseek",
        model: MODEL,
        fallbackUsed: false,
        schemaValid: true,
        originalPreserved: benchmarkCase.gold.sourceTextMustBePreserved
          ? payload.originalText === benchmarkCase.input.sourceText
          : undefined,
        humanConfirmationExposed: payload.humanConfirmationExposed,
      };
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        taskType: benchmarkCase.taskType,
        status: "completed",
        provider: "deepseek",
        model: MODEL,
        visualInputSupported: false,
        classificationModality: benchmarkCase.taskType === "classify_item" ? "text_hints_only" : "not_applicable",
        latencyMs,
        inputTokens: usage.prompt_tokens ?? 0,
        outputTokens: usage.completion_tokens ?? 0,
        costUsd,
        response: payload,
        score: scoreBenchmarkCase(benchmarkCase, observation),
      });
    } catch (error) {
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        taskType: benchmarkCase.taskType,
        status: "failed",
        provider: "deepseek",
        model: MODEL,
        visualInputSupported: false,
        classificationModality: benchmarkCase.taskType === "classify_item" ? "text_hints_only" : "not_applicable",
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await persist(results, budgetUsd);
  }

  const evidence = await persist(results, budgetUsd);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.withinBudget || evidence.failedCaseCount > 0 || evidence.budgetStoppedCount > 0) {
    process.exitCode = 1;
  }
}

void main();
