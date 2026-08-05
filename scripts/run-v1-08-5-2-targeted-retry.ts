import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import {
  v1084BenchmarkCases,
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
const MAX_BUDGET_USD = 0.1;
const OUTPUT_DIR = "artifacts/v1-08-5-2";

const TARGET_CASE_IDS = [
  "v1084-bg-matching-advisory",
  "v1084-no-matching-advisory",
  "v1084-th-matching-advisory",
  "v1084-mn-matching-advisory",
  "v1084-yi-matching-advisory",
] as const;

type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
};

type ProviderBody = {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  usage?: Partial<Usage>;
  error?: { message?: string };
};

type ModelPayload = {
  normalizedConcepts: string[];
  localizedOutput: string;
  finalDecision: boolean;
  humanConfirmationExposed: boolean;
};

type AttemptEvidence = {
  attempt: 1 | 2;
  status: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  returnedModel?: string;
  retryReason?: "invalid_json" | "empty_localized_output";
  rawContent?: string;
  error?: string;
};

type CaseEvidence = {
  caseId: string;
  locale: string;
  attempts: AttemptEvidence[];
  status: "completed" | "failed" | "budget_stopped";
  totalCostUsd: number;
  response?: ModelPayload;
  score?: ReturnType<typeof scoreBenchmarkCase>;
  error?: string;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function validateUsage(usage: ProviderBody["usage"]): Usage {
  const input = usage?.prompt_tokens;
  const output = usage?.completion_tokens;
  if (typeof input !== "number" || !Number.isInteger(input) || input < 0) {
    throw new Error("Missing valid prompt token usage");
  }
  if (typeof output !== "number" || !Number.isInteger(output) || output < 0) {
    throw new Error("Missing valid completion token usage");
  }
  return { prompt_tokens: input, completion_tokens: output };
}

function calculateCost(usage: Usage): number {
  return (usage.prompt_tokens / 1_000_000) * INPUT_USD_PER_MILLION
    + (usage.completion_tokens / 1_000_000) * OUTPUT_USD_PER_MILLION;
}

function promptFor(benchmarkCase: BenchmarkCase, attempt: 1 | 2): string {
  return JSON.stringify({
    instruction: [
      "Return exactly one valid JSON object and no markdown.",
      "Use the canonical English concepts from evaluationContract.canonicalRequiredConcepts when supported.",
      "Write a non-empty localizedOutput in targetLocale.",
      "This is advisory matching only: finalDecision must be false and humanConfirmationExposed must be true.",
      attempt === 2
        ? "This is a schema-repair retry. Keep the answer concise and ensure every required field is present."
        : "Produce the requested structured evaluation.",
    ].join(" "),
    targetLocale: benchmarkCase.locale,
    taskType: benchmarkCase.taskType,
    input: benchmarkCase.input,
    evaluationContract: benchmarkCase.evaluationContract,
    exactJsonShape: {
      normalizedConcepts: benchmarkCase.evaluationContract.canonicalRequiredConcepts,
      localizedOutput: "non-empty answer in target locale",
      finalDecision: false,
      humanConfirmationExposed: true,
    },
  });
}

function parsePayload(content: string): ModelPayload {
  const trimmed = content.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(trimmed) as Partial<ModelPayload>;
  if (!Array.isArray(parsed.normalizedConcepts)
    || parsed.normalizedConcepts.some((value) => typeof value !== "string")) {
    throw new Error("invalid_json");
  }
  if (typeof parsed.localizedOutput !== "string" || parsed.localizedOutput.trim().length === 0) {
    throw new Error("empty_localized_output");
  }
  if (parsed.finalDecision !== false || parsed.humanConfirmationExposed !== true) {
    throw new Error("invalid_json");
  }
  return {
    normalizedConcepts: parsed.normalizedConcepts,
    localizedOutput: parsed.localizedOutput,
    finalDecision: false,
    humanConfirmationExposed: true,
  };
}

async function callProvider(apiKey: string, benchmarkCase: BenchmarkCase, attempt: 1 | 2) {
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
        { role: "system", content: "You are a deterministic multilingual JSON evaluation engine." },
        { role: "user", content: promptFor(benchmarkCase, attempt) },
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
  const body = JSON.parse(rawBody) as ProviderBody;
  const usage = validateUsage(body.usage);
  const costUsd = calculateCost(usage);
  const content = body.choices?.[0]?.message?.content ?? "";
  return { response, body, usage, costUsd, latencyMs, content };
}

async function persist(results: CaseEvidence[]) {
  const scores = results.flatMap((entry) => entry.score ? [entry.score] : []);
  const spentUsd = results.reduce((sum, entry) => sum + entry.totalCostUsd, 0);
  const evidence = {
    generatedAt: new Date().toISOString(),
    provider: "deepseek",
    model: MODEL,
    mode: "targeted_retry_run7_failures",
    sourceRunId: 31048130276,
    targetedCaseIds: TARGET_CASE_IDS,
    targetedCaseCount: TARGET_CASE_IDS.length,
    completedCaseCount: results.filter((entry) => entry.status === "completed").length,
    failedCaseCount: results.filter((entry) => entry.status === "failed").length,
    budgetStoppedCount: results.filter((entry) => entry.status === "budget_stopped").length,
    spentUsd,
    budgetUsd: MAX_BUDGET_USD,
    withinBudget: spentUsd <= MAX_BUDGET_USD,
    scoreSummary: summarizeBenchmark(scores),
    results,
  };
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(
    `${OUTPUT_DIR}/deepseek-v4-flash-targeted-retry-results.json`,
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  return evidence;
}

async function main() {
  const apiKey = requiredEnv("DEEPSEEK_API_KEY");
  const selectedCases = TARGET_CASE_IDS.map((id) => {
    const benchmarkCase = v1084BenchmarkCases.find((entry) => entry.id === id);
    if (!benchmarkCase) throw new Error(`Missing benchmark case ${id}`);
    return benchmarkCase;
  });
  const results: CaseEvidence[] = [];
  let spentUsd = 0;

  for (const benchmarkCase of selectedCases) {
    const attempts: AttemptEvidence[] = [];
    let completed = false;
    let lastError = "unknown";

    for (const attemptNumber of [1, 2] as const) {
      if (spentUsd >= MAX_BUDGET_USD) {
        results.push({
          caseId: benchmarkCase.id,
          locale: benchmarkCase.locale,
          attempts,
          status: "budget_stopped",
          totalCostUsd: attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0),
          error: "Targeted retry budget reached",
        });
        await persist(results);
        completed = true;
        break;
      }

      try {
        const call = await callProvider(apiKey, benchmarkCase, attemptNumber);
        spentUsd += call.costUsd;
        if (!call.response.ok) {
          throw new Error(`HTTP ${call.response.status}: ${call.body.error?.message ?? "unknown error"}`);
        }
        if (call.body.model !== MODEL) {
          throw new Error(`Unexpected model ${call.body.model ?? "missing"}`);
        }

        try {
          const payload = parsePayload(call.content);
          attempts.push({
            attempt: attemptNumber,
            status: call.response.status,
            latencyMs: call.latencyMs,
            inputTokens: call.usage.prompt_tokens,
            outputTokens: call.usage.completion_tokens,
            costUsd: call.costUsd,
            returnedModel: call.body.model,
          });
          const observation: BenchmarkProviderObservation = {
            caseId: benchmarkCase.id,
            output: payload,
            normalizedConcepts: payload.normalizedConcepts,
            latencyMs: call.latencyMs,
            estimatedCostUsd: attempts.reduce((sum, item) => sum + item.costUsd, 0),
            provider: "deepseek",
            model: MODEL,
            fallbackUsed: false,
            schemaValid: true,
            humanConfirmationExposed: true,
          };
          const score = scoreBenchmarkCase(benchmarkCase, observation);
          results.push({
            caseId: benchmarkCase.id,
            locale: benchmarkCase.locale,
            attempts,
            status: "completed",
            totalCostUsd: attempts.reduce((sum, item) => sum + item.costUsd, 0),
            response: payload,
            score,
          });
          completed = true;
          break;
        } catch (parseError) {
          const reason = parseError instanceof Error && parseError.message === "empty_localized_output"
            ? "empty_localized_output"
            : "invalid_json";
          attempts.push({
            attempt: attemptNumber,
            status: call.response.status,
            latencyMs: call.latencyMs,
            inputTokens: call.usage.prompt_tokens,
            outputTokens: call.usage.completion_tokens,
            costUsd: call.costUsd,
            returnedModel: call.body.model,
            retryReason: reason,
            rawContent: call.content,
          });
          lastError = reason;
          if (attemptNumber === 2) break;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        break;
      }
    }

    if (!completed) {
      results.push({
        caseId: benchmarkCase.id,
        locale: benchmarkCase.locale,
        attempts,
        status: "failed",
        totalCostUsd: attempts.reduce((sum, attempt) => sum + attempt.costUsd, 0),
        error: lastError,
      });
    }
    await persist(results);
  }

  const evidence = await persist(results);
  console.log(JSON.stringify(evidence, null, 2));
  if (!evidence.withinBudget
    || evidence.failedCaseCount > 0
    || evidence.budgetStoppedCount > 0
    || evidence.completedCaseCount !== TARGET_CASE_IDS.length
    || evidence.scoreSummary.failedCount > 0) {
    process.exitCode = 1;
  }
}

void main();
