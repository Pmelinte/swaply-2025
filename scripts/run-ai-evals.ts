import { runLocalAIEvals } from "../src/lib/ai-evals/localRunner";

const results = await runLocalAIEvals([
  { name: "classification fallback", taskType: "classify_item", input: { titleHint: "phone" }, locale: "en" },
  { name: "moderation fallback", taskType: "moderate_chat", input: { text: "hello" }, locale: "ro" },
]);

console.table(results);
if (results.some((result) => !result.schemaCorrect || !result.fallbackCorrect || result.estimatedCost !== 0)) {
  process.exitCode = 1;
}
