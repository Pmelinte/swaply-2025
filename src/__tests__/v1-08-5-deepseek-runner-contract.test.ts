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

describe("V1-08.5 DeepSeek provider-backed benchmark contract", () => {
  it("pins the authorised provider, model and hard budget ceiling", () => {
    expect(runner).toContain('const MODEL = "deepseek-v4-flash"');
    expect(runner).toContain("const MAX_AUTHORISED_BUDGET_USD = 5");
    expect(runner).toContain('const API_URL = "https://api.deepseek.com/chat/completions"');
    expect(runner).toContain("spentUsd + worstCaseNextRequestUsd > budgetUsd");
  });

  it("keeps execution manual and requires the repository secret", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("secrets.DEEPSEEK_API_KEY");
    expect(workflow).not.toContain("schedule:");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).not.toContain("push:");
  });

  it("uses non-thinking JSON output and uploads evidence", () => {
    expect(runner).toContain('thinking: { type: "disabled" }');
    expect(runner).toContain('response_format: { type: "json_object" }');
    expect(runner).toContain("deepseek-summary.json");
    expect(workflow).toContain("v1-08-5-deepseek-evidence");
  });
});
