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

const results = await runLocalAIEvals(cases);
const summary = summarizeLocalAIEvals(results);

await Promise.all([
  writeFile("ai-eval-results.json", `${JSON.stringify(results, null, 2)}\n`, "utf8"),
  writeFile("ai-eval-summary.json", `${JSON.stringify(summary, null, 2)}\n`, "utf8"),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
