import { writeFile } from "node:fs/promises";
import {
  passesAIEvalGate,
  runLocalAIEvals,
  summarizeLocalAIEvals,
  type AIEvalCase,
} from "../src/lib/ai-evals/localRunner";

const cases: AIEvalCase[] = [
  {
    name: "classification fallback contract",
    taskType: "classify_item",
    input: { titleHint: "phone", descriptionHint: "used smartphone" },
    locale: "en",
    validateOutput: (output) => isRecord(output)
      && typeof output.category === "string"
      && typeof output.confidence === "number"
      && output.source === "fallback",
  },
  {
    name: "translation preserves original",
    taskType: "translate",
    input: { text: "Bună ziua", sourceLocale: "ro", targetLocale: "en" },
    locale: "ro",
    validateOutput: (output) => isRecord(output)
      && output.originalText === "Bună ziua"
      && output.translatedText === "Bună ziua"
      && output.source === "fallback",
  },
  {
    name: "semantic match cannot affect ranking",
    taskType: "match",
    input: {
      offeredItem: { title: "Camera", category: "electronics" },
      requestedItem: { title: "Tripod", category: "electronics" },
      baseScore: 72,
      distanceKm: 12,
      locale: "en",
    },
    locale: "en",
    validateOutput: (output) => isRecord(output)
      && typeof output.semanticScore === "number"
      && output.scoreAdjustment === 0
      && output.source === "fallback",
  },
  {
    name: "moderation fallback remains safe and deterministic",
    taskType: "moderate_chat",
    input: { text: "Hello, is the item still available?" },
    locale: "en",
    validateOutput: (output) => isRecord(output)
      && output.safe === true
      && Array.isArray(output.flags),
  },
];

async function main() {
  try {
    const results = await runLocalAIEvals(cases);
    const summary = summarizeLocalAIEvals(results);

    await Promise.all([
      writeJson("ai-eval-results.json", results),
      writeJson("ai-eval-summary.json", summary),
    ]);

    console.table(results.map((result) => ({
      task: result.taskType,
      name: result.name,
      passed: result.passed,
      status: result.status,
      latencyMs: result.latencyMs,
      estimatedCost: result.estimatedCost,
    })));
    console.log("AI evaluation summary", summary);

    if (!passesAIEvalGate(summary)) {
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    const failure = {
      fatal: true,
      message,
      generatedAt: new Date().toISOString(),
    };
    console.error("AI evaluation runner failed", message);
    await Promise.all([
      writeJson("ai-eval-results.json", []),
      writeJson("ai-eval-summary.json", failure),
    ]);
    process.exitCode = 1;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function writeJson(path: string, value: unknown) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

void main();
