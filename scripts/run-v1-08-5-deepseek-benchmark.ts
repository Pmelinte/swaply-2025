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
const MAX_AUTHORISED_BUDGET_USD = 5;
const INPUT_PRICE_PER_MILLION = 0.14;
const OUTPUT_PRICE_PER_MILLION = 0.28;
const MAX_OUTPUT_TOKENS = 500;
const OUTPUT_DIR = "artifacts/v1-08-5";

type DeepSeekUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

type DeepSeekResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: DeepSeekUsage;
  error?: { message?: string };
};

type StructuredOutput = {
  output: Record<string, unknown>;
  normalizedConcepts: string[];
  l1Category?: string;
  l2Category?: string;
  originalPreserved?: boolean;
  humanConfirmationExposed?: boolean;
  schemaValid: boolean;
};

type CaseEvidence = {
  caseId: string;
  locale: string;
  taskType: string;
  provider: "deepseek";
  model: typeof MODEL;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  conservativeCostUsd: number;
  rawContent: string;
  parsed: StructuredOutput | null;
  error: string | null;
};

function parseBudget(): number {
  const raw = process.env.V1085_MAX_BUDGET_USD ?? "5";
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0 || value > MAX_AUTHORISED_BUDGET_USD) {
    throw new Error(
      `V1085_MAX_BUDGET_USD must be greater than 0 and at most ${MAX_AUTHORISED_BUDGET_USD}`,
    );
  }
  return value;
}

function conservativeCost(usage: DeepSeekUsage | undefined): number {
  const promptTokens = usage?.prompt_tokens ?? 0;
  const completionTokens = usage?.completion_tokens ?? 0;
  return (
    (promptTokens / 1_000_000) * INPUT_PRICE_PER_MILLION +
    (completionTokens / 1_000_000) * OUTPUT_PRICE_PER_MILLION
  );
}

function promptFor(benchmarkCase: BenchmarkCase): string {
  return JSON.stringify(
    {
      instruction:
        "Evaluate this Swaply case in the requested locale. Return JSON only. Do not execute consequential actions. Preserve source text for translations. Matching and moderation must remain advisory and expose human confirmation when required.",
      requiredJsonShape: {
        output: "task-specific object in the requested locale",
        normalizedConcepts: ["canonical semantic concepts expressed as concise English identifiers"],
        l1Category: "optional canonical category",
        l2Category: "optional canonical subcategory",
        originalPreserved: "boolean when translation is requested",
        humanConfirmationExposed: "boolean",
        schemaValid: "boolean",
      },
      case: benchmarkCase,
    },
    null,
    2,
  );
}

function parseStructuredOutput(content: string): StructuredOutput {
  const parsed = JSON.parse(content) as Partial<StructuredOutput>;
  if (!parsed || typeof parsed !== "object") throw new Error("Response is not an object");
  if (!parsed.output || typeof parsed.output !== "object" || Array.isArray(parsed.output)) {
    throw new Error("Missing output object");
  }
  if (!Array.isArray(parsed.normalizedConcepts)) {
    throw new Error("Missing normalizedConcepts array");
  }
  if (typeof parsed.schemaValid !== "boolean") {
    throw new Error("Missing schemaValid boolean");
  }
  return {
    output: parsed.output as Record<string, unknown>,
    normalizedConcepts: parsed.normalizedConcepts.map(String),
    l1Category: typeof parsed.l1Category === "string" ? parsed.l1Category : undefined,
    l2Category: typeof parsed.l2Category === "string" ? parsed.l2Category : undefined,
    originalPreserved:
      typeof parsed.originalPreserved === "boolean" ? parsed.originalPreserved : undefined,
    humanConfirmationExposed:
      typeof parsed.humanConfirmationExposed === "boolean"
        ? parsed.humanConfirmationExposed
        : undefined,
    schemaValid: parsed.schemaValid,
  };
}

async function runCase(
  apiKey: string,
  benchmarkCase: BenchmarkCase,
): Promise<CaseEvidence> {
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a deterministic multilingual benchmark subject. Output one valid JSON object and no markdown.",
          },
          { role: "user", content: promptFor(benchmarkCase) },
        ],
        thinking: { type: "disabled" },
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    });
  } catch (error) {
    return {
      caseId: benchmarkCase.id,
      locale: benchmarkCase.locale,
      taskType: benchmarkCase.taskType,
      provider: "deepseek",
      model: MODEL,
      latencyMs: Math.round(performance.now() - started),
      promptTokens: 0,
      completionTokens: 0,
      conservativeCostUsd: 0,
      rawContent: "",
      parsed: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const payload = (await response.json()) as DeepSeekResponse;
  const content = payload.choices?.[0]?.message?.content ?? "";
  const usage = payload.usage;
  let parsed: StructuredOutput | null = null;
  let error: string | null = null;

  if (!response.ok) {
    error = payload.error?.message ?? `HTTP ${response.status}`;
  } else if (!content.trim()) {
    error = "DeepSeek returned empty content";
  } else {
    try {
      parsed = parseStructuredOutput(content);
    } catch (parseError) {
      error = parseError instanceof Error ? parseError.message : String(parseError);
    }
  }

  return {
    caseId: benchmarkCase.id,
    locale: benchmarkCase.locale,
    taskType: benchmarkCase.taskType,
    provider: "deepseek",
    model: MODEL,
    latencyMs: Math.round(performance.now() - started),
    promptTokens: usage?.prompt_tokens ?? 0,
    completionTokens: usage?.completion_tokens ?? 0,
    conservativeCostUsd: conservativeCost(usage),
    rawContent: content,
    parsed,
    error,
  };
}

async function main() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is required");

  const budgetUsd = parseBudget();
  const evidence: CaseEvidence[] = [];
  let spentUsd = 0;

  for (const benchmarkCase of v1084BenchmarkCases) {
    const worstCaseNextRequestUsd =
      (2_500 / 1_000_000) * INPUT_PRICE_PER_MILLION +
      (MAX_OUTPUT_TOKENS / 1_000_000) * OUTPUT_PRICE_PER_MILLION;
    if (spentUsd + worstCaseNextRequestUsd > budgetUsd) {
      throw new Error(
        `Budget guard stopped before ${benchmarkCase.id}: ${spentUsd.toFixed(6)} USD spent`,
      );
    }

    const result = await runCase(apiKey, benchmarkCase);
    evidence.push(result);
    spentUsd += result.conservativeCostUsd;
    console.log(
      `${evidence.length}/${v1084BenchmarkCases.length} ${result.caseId} cost=${result.conservativeCostUsd.toFixed(6)} total=${spentUsd.toFixed(6)} error=${result.error ?? "none"}`,
    );
  }

  const observations: BenchmarkProviderObservation[] = evidence
    .filter((entry): entry is CaseEvidence & { parsed: StructuredOutput } => entry.parsed !== null)
    .map((entry) => ({
      caseId: entry.caseId,
      output: entry.parsed.output,
      normalizedConcepts: entry.parsed.normalizedConcepts,
      l1Category: entry.parsed.l1Category,
      l2Category: entry.parsed.l2Category,
      latencyMs: entry.latencyMs,
      estimatedCostUsd: entry.conservativeCostUsd,
      provider: entry.provider,
      model: entry.model,
      fallbackUsed: false,
      schemaValid: entry.parsed.schemaValid,
      originalPreserved: entry.parsed.originalPreserved,
      humanConfirmationExposed: entry.parsed.humanConfirmationExposed,
    }));

  const byId = new Map(v1084BenchmarkCases.map((entry) => [entry.id, entry]));
  const scores = observations.map((observation) =>
    scoreBenchmarkCase(byId.get(observation.caseId)!, observation),
  );
  const summary = summarizeBenchmark(scores);
  const failures = evidence.filter((entry) => entry.error !== null);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all([
    writeFile(`${OUTPUT_DIR}/deepseek-evidence.json`, `${JSON.stringify(evidence, null, 2)}\n`),
    writeFile(`${OUTPUT_DIR}/deepseek-scores.json`, `${JSON.stringify(scores, null, 2)}\n`),
    writeFile(
      `${OUTPUT_DIR}/deepseek-summary.json`,
      `${JSON.stringify(
        {
          dataset: v1084BenchmarkManifest,
          provider: "deepseek",
          model: MODEL,
          budgetUsd,
          conservativeSpentUsd: spentUsd,
          completedCases: evidence.length,
          parsedCases: observations.length,
          apiFailures: failures.length,
          summary,
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    ),
  ]);

  if (evidence.length !== v1084BenchmarkCases.length || failures.length > 0) {
    process.exitCode = 1;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
