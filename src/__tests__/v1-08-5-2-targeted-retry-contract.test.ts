import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const runner = readFileSync(
  resolve(process.cwd(), "scripts/run-v1-08-5-2-targeted-retry.ts"),
  "utf8",
);
const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/v1-08-5-2-targeted-retry.yml"),
  "utf8",
);

describe("V1-08.5.2 targeted retry contract", () => {
  it("targets only the five failed run-7 cases", () => {
    for (const locale of ["bg", "no", "th", "mn", "yi"]) {
      expect(runner).toContain(`v1084-${locale}-matching-advisory`);
    }
    expect(runner).toContain("targetedCaseCount: TARGET_CASE_IDS.length");
    expect(workflow).toContain("5 failed cases only");
  });

  it("allows exactly one retry only for recoverable response defects", () => {
    expect(runner).toContain("for (const attemptNumber of [1, 2] as const)");
    expect(runner).toContain('"invalid_json"');
    expect(runner).toContain('"empty_localized_output"');
    expect(runner).not.toContain("RETRY_DELAYS_MS");
  });

  it("accounts for every attempt and keeps a strict local budget", () => {
    expect(runner).toContain("const MAX_BUDGET_USD = 0.1");
    expect(runner).toContain("spentUsd += call.costUsd");
    expect(runner).toContain("attempts.reduce((sum, item) => sum + item.costUsd, 0)");
    expect(runner).toContain("withinBudget: spentUsd <= MAX_BUDGET_USD");
  });

  it("keeps provider credentials secret and preserves evidence", () => {
    expect(workflow).toContain("secrets.DEEPSEEK_API_KEY");
    expect(runner).not.toMatch(/sk-[A-Za-z0-9_-]{16,}/);
    expect(workflow).toContain("upload-artifact@v4");
    expect(workflow).toContain("retention-days: 90");
  });
});
