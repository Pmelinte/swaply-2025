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

type DeepSeekUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens?: number;
};

type DeepSeekResponse = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: Partial<DeepSeekUsage>;
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
  requestedModel: typeof MODEL;
  returnedModel?: string;
  visualInputSupported: false;
  classificationModality: "text_hints_only" | "not_applicable";
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  response?: ModelPayload;
  schemaValid?: boolean;
  score?: ReturnType<typeof scoreBenchmarkCase>;
  rawResponse?: string;
  error?: string;
};

type ProviderAttempt = {
  latencyMs: number;
  status: number;
  rawBody: string;
  body: DeepSeekResponse | null;
  usage: DeepSeekUsage | null;
  costUsd: number;
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

function validateUsage(usage: DeepSeekResponse["usage"]): DeepSeekUsage {
  const promptTokens = usage?.prompt_tokens;
  const completionTokens = usage?.completion_tokens;

  if (typeof promptTokens !== "number" || !Number.isInteger(promptTokens) || promptTokens < 0) {
    throw new Error("DeepSeek response is missing valid prompt token usage; cost cannot be proven");
  }
  if (
    typeof completionTokens !== "number"
    || !Number.isInteger(completionTokens)
    || completionTokens < 0
  ) {
    throw new Error("DeepSeek response is missing valid completion token usage; cost cannot be proven");
  }

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: usage?.total_tokens,
  };
}

function calculateCost(usage: DeepSeekUsage): number {
  return (usage.prompt_tokens / 1_000_000) * INPUT_USD_PER_MILLION
    + (usage.completion_tokens / 1_000_000) * OUTPUT_USD_PER_MILLION;
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
      "normalizedConcepts must use canonical English concepts from the gold label only when semantically supported.",
      "Never invent image observations: imageFixture is an identifier and no image bytes are provided.",
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

function validateTaskSchema(benchmarkCase: BenchmarkCase, payload: ModelPayload): boolean {
  if (!Array.isArray(payload.normalizedConcepts)) return false;
  if (payload.normalizedConcepts.some((value) => typeof value !== "string")) return false;
  if (typeof payload.localizedOutput !== "string" || payload.localizedOutput.trim().length === 0) {
    return false;
  }
  if (benchmarkCase.gold.humanConfirmationRequired && payload.humanConfirmationExposed !== true) {
    return false;
  }
  if (benchmarkCase.gold.advisoryOnly && payload.finalDecision !== false) return false;
  if (benchmarkCase.taskType === "classify_item") {
    return typeof payload.l1Category === "string" && typeof payload.l2Category === "string";
  }
  if (benchmarkCase.taskType === "translate") {
    return typeof payload.originalText === "string";
  }
  if (benchmarkCase.taskType === "moderate_chat") {
    return payload.moderationLabel === "safe"
      || payload.moderationLabel === "review"
      || payload.moderationLabel === "unsafe";
  }
  return true;
}

async function callDeepSeek(apiKey: string, benchmarkCase: BenchmarkCase): Promise<ProviderAttempt> {
  const started = performance.now();
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
  const rawBody = await response.text();
  let body: DeepSeekResponse | null = null;
  try {
    body = JSON.parse(rawBody) as DeepSeekResponse;
  } catch {
    body = null;
  }

  let usage: DeepSeekUsage | null = null;
  let costUsd = 0;
  if (body?.usage) {
    usage = validateUsage(body.usage);
    costUsd = calculateCost(usage);
  }

  return {
    latencyMs,
    status: response.status,
    rawBody,
    body,
    usage,
    costUsd,
  };
}

async function persist(results: CaseEvidence[], budgetUsd: number) {
  const completedScores = results.flatMap((entry) => (entry.score ? [entry.score] : []));
  const spentUsd = results.reduce((sum, entry) => sum + (entry.costUsd ?? 0), 0);
  const evidence = {
    generatedAt: new Date().toISOString(),
    provider: "deepseek",
    requestedModel: MODEL,
    modelMode: "non-thinking",
    datasetVersion: v1084BenchmarkManifest.version,
    localeCount: v1084BenchmarkManifest.localeCount,
    plannedCaseCount: v1084BenchmarkManifest.caseCount,
    attemptedCaseCount: results.length,
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
  await writeFile(
    `${OUTPUT_DIR}/deepseek-v4-flash-results.json`,
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  return evidence;
}

async function main() {
  const apiKey = requiredEnv("DEEPSEEK_API_KEY");
  const budgetUsd = parseBudget();
  const reserveUsd = conservativeNextCallReserveUsd();
  const results: CaseEvidence[] = [];
  let spentUsd = 0;

  for (const benchmarkCase of v1084BenchmarkCases) {
    const classificationModality = benchmarkCase.taskType === "classify_item"
      ? "text_hints_only" as const
      : "not_applicable" as const;

    if (spentUsd + reserveUsd > budgetUsd) {
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        taskType: benchmarkCase.taskType,
        status: "budget_stopped",
        provider: "deepseek",
        requestedModel: MODEL,
        visualInputSupported: false,
        classificationModality,
        error: "Stopped before request because the conservative reserve would exceed the approved cap",
      });
      await persist(results, budgetUsd);
      break;
    }

    try {
      const attempt = await callDeepSeek(apiKey, benchmarkCase);
      spentUsd += attempt.costUsd;

      if (!attempt.body) {
        results.push({
          caseId: benchmarkCase.id,
          locale: benchmarkCase.locale,
          taskType: benchmarkCase.taskType,
          status: "failed",
          provider: "deepseek",
          requestedModel: MODEL,
          visualInputSupported: false,
          classificationModality,
          latencyMs: attempt.latencyMs,
          costUsd: attempt.costUsd,
          rawResponse: attempt.rawBody,
          error: `DeepSeek returned non-JSON response with HTTP ${attempt.status}`,
        });
        await persist(results, budgetUsd);
        continue;
      }

      if (!attempt.usage) {
        results.push({
          caseId: benchmarkCase.id,
          locale: benchmarkCase.locale,
          taskType: benchmarkCase.taskType,
          status: "failed",
          provider: "deepseek",
          requestedModel: MODEL,
          returnedModel: attempt.body.model,
          visualInputSupported: false,
          classificationModality,
          latencyMs: attempt.latencyMs,
          rawResponse: attempt.rawBody,
          error: "DeepSeek response omitted valid usage; cost cannot be proven",
        });
        await persist(results, budgetUsd);
        continue;
      }

      if (attempt.status < 200 || attempt.status >= 300) {
        results.push({
          caseId: benchmarkCase.id,
          locale: benchmarkCase.locale,
          taskType: benchmarkCase.taskType,
          status: "failed",
          provider: "deepseek",
          requestedModel: MODEL,
          returnedModel: attempt.body.model,
          visualInputSupported: false,
          classificationModality,
          latencyMs: attempt.latencyMs,
          inputTokens: attempt.usage.prompt_tokens,
          outputTokens: attempt.usage.completion_tokens,
          costUsd: attempt.costUsd,
          rawResponse: attempt.rawBody,
          error: `DeepSeek HTTP ${attempt.status}: ${attempt.body.error?.message ?? "unknown error"}`,
        });
        await persist(results, budgetUsd);
        continue;
      }

      if (attempt.body.model !== MODEL) {
        results.push({
          caseId: benchmarkCase.id,
          locale: benchmarkCase.locale,
          taskType: benchmarkCase.taskType,
          status: "failed",
          provider: "deepseek",
          requestedModel: MODEL,
          returnedModel: attempt.body.model,
          visualInputSupported: false,
          classificationModality,
          latencyMs: attempt.latencyMs,
          inputTokens: attempt.usage.prompt_tokens,
          outputTokens: attempt.usage.completion_tokens,
          costUsd: attempt.costUsd,
          error: `Provider returned unexpected model ${attempt.body.model ?? "missing"}`,
        });
        await persist(results, budgetUsd);
        continue;
      }

      const content = attempt.body.choices?.[0]?.message?.content;
      if (!content) throw new Error("DeepSeek returned no message content");
      const payload = parsePayload(content);
      const schemaValid = validateTaskSchema(benchmarkCase, payload);
      const observation: BenchmarkProviderObservation = {
        caseId: benchmarkCase.id,
        output: {
          ...payload,
          finalDecision: payload.finalDecision,
          moderationLabel: payload.moderationLabel,
        },
        normalizedConcepts: payload.normalizedConcepts,
        l1Category: payload.l1Category,
        l2Category: payload.l2Category,
        latencyMs: attempt.latencyMs,
        estimatedCostUsd: attempt.costUsd,
        provider: "deepseek",
        model: attempt.body.model,
        fallbackUsed: false,
        schemaValid,
        originalPreserved: benchmarkCase.gold.sourceTextMustBePreserved
          ? payload.originalText === benchmarkCase.input.sourceText
          : undefined,
        humanConfirmationExposed: payload.humanConfirmationExposed,
      };
      const score = scoreBenchmarkCase(benchmarkCase, observation);
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        taskType: benchmarkCase.taskType,
        status: "completed",
        provider: "deepseek",
        requestedModel: MODEL,
        returnedModel: attempt.body.model,
        visualInputSupported: false,
        classificationModality,
        latencyMs: attempt.latencyMs,
        inputTokens: attempt.usage.prompt_tokens,
        outputTokens: attempt.usage.completion_tokens,
        costUsd: attempt.costUsd,
        response: payload,
        schemaValid,
        score,
      });
    } catch (error) {
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        taskType: benchmarkCase.taskType,
        status: "failed",
        provider: "deepseek",
        requestedModel: MODEL,
        visualInputSupported: false,
        classificationModality,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await persist(results, budgetUsd);
  }

  const evidence = await persist(results, budgetUsd);
  console.log(JSON.stringify(evidence, null, 2));
  if (
    !evidence.withinBudget
    || evidence.failedCaseCount > 0
    || evidence.budgetStoppedCount > 0
    || evidence.scoreSummary.failedCount > 0
    || evidence.completedCaseCount !== evidence.plannedCaseCount
  ) {
    process.exitCode = 1;
  }
}

void main();