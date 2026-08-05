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

  it("persists evidence incrementally and records actual token cost", () => {
    expect(runner).toContain("prompt_tokens");
    expect(runner).toContain("completion_tokens");
    expect(runner).toContain("await persist(results, budgetUsd)");
    expect(workflow).toContain("upload-artifact@v4");
  });
});
