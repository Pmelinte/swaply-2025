import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const runner = readFileSync(
  resolve(process.cwd(), "scripts/run-v1-08-5-deepseek-benchmark.ts"),
  "utf8",
);
const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/v1-08-5-deepseek-benchmark.yml"),
  "utf8",
);

describe("V1-08.5 DeepSeek real benchmark safety contract", () => {
  it("pins the authorised provider, model, endpoint and five-dollar ceiling", () => {
    expect(runner).toContain('const API_URL = "https://api.deepseek.com/chat/completions"');
    expect(runner).toContain('const MODEL = "deepseek-v4-flash"');
    expect(runner).toContain("budget > 5");
    expect(workflow).toContain('default: "5"');
    expect(workflow).toContain("b>5");
  });

  it("requires a secret and never embeds an API key", () => {
    expect(runner).toContain('requiredEnv("DEEPSEEK_API_KEY")');
    expect(workflow).toContain("secrets.DEEPSEEK_API_KEY");
    expect(runner).not.toMatch(/sk-[A-Za-z0-9_-]{16,}/);
    expect(workflow).not.toMatch(/sk-[A-Za-z0-9_-]{16,}/);
  });

  it("keeps image evidence explicitly unproven for a text-only provider", () => {
    expect(runner).toContain("visualInputSupported: false");
    expect(runner).toContain('visualClassificationEvidence: "NOT_PROVEN"');
    expect(runner).toContain('classificationModality: "text_hints_only"');
    expect(runner).toContain("Never invent image observations");
  });

  it("fails closed when token usage or returned model cannot be proven", () => {
    expect(runner).toContain("DeepSeek response has missing or invalid token usage");
    expect(runner).toContain("DeepSeek response omitted valid usage; cost cannot be proven");
    expect(runner).toContain("attempt.body.model !== MODEL");
    expect(runner).toContain("Provider returned unexpected model");
  });

  it("does not retry billable provider responses and preserves non-JSON evidence", () => {
    expect(runner).not.toContain("RETRY_DELAYS_MS");
    expect(runner).toContain("const rawBody = await response.text()");
    expect(runner).toContain("DeepSeek returned non-JSON response");
    expect(runner).toContain("rawResponse: attempt.rawBody");
  });

  it("derives task schema locally and stops immediately at the budget guard", () => {
    expect(runner).toContain("validateTaskSchema(benchmarkCase, payload)");
    expect(runner).toContain("schemaValid,");
    expect(runner).toContain("await persist(results, budgetUsd);\n      break;");
  });

  it("persists incremental evidence and fails when any scored case fails", () => {
    expect(runner).toContain("prompt_tokens");
    expect(runner).toContain("completion_tokens");
    expect(runner).toContain("await persist(results, budgetUsd)");
    expect(runner).toContain("evidence.scoreSummary.failedCount > 0");
    expect(runner).toContain("evidence.completedCaseCount !== evidence.plannedCaseCount");
    expect(workflow).toContain("upload-artifact@v4");
  });
});
