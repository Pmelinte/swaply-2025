import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type GlobalUiEvidence = {
  pass: boolean;
  failures: string[];
  catalogues: {
    catalogueCount: number;
    englishKeyCount: number;
    completeSourceLocales: string[];
    maxTechnicalFallbackKeysPerLocale: number;
    technicalFallbackCountByLocale: Record<string, number>;
    completeSourceMissingByLocale: Record<string, number>;
    extraKeyCountByLocale: Record<string, number>;
    overBudgetLocales: Record<string, number>;
  };
  blog: {
    sourceArticleCount: number;
    localeDirectories: string[];
    localized: Record<string, { translatedCount: number; missingCount: number }>;
    orphanTranslations: Record<string, string[]>;
  };
  hardcodedPublicStrings: Array<{
    file: string;
    value: string;
    line: number;
  }>;
  layout: {
    userContentDirectionAuto: boolean;
    longTextWrap: boolean;
    minWidthContainment: boolean;
    overflowContainment: boolean;
  };
};

function runScanner(): GlobalUiEvidence {
  const result = spawnSync(
    process.execPath,
    [resolve(process.cwd(), "scripts/check-global-ui-completeness.mjs")],
    { encoding: "utf8", maxBuffer: 2 * 1024 * 1024 },
  );

  if (result.error) {
    throw result.error;
  }

  if (!result.stdout.trim()) {
    throw new Error(
      `Global UI scanner produced no evidence. stderr: ${result.stderr || "<empty>"}`,
    );
  }

  return JSON.parse(result.stdout) as GlobalUiEvidence;
}

describe("V1-08.3 global UI completeness", () => {
  it("produces deterministic PASS evidence for catalogues, Blog and public strings", () => {
    const evidence = runScanner();

    expect(evidence.pass, JSON.stringify(evidence, null, 2)).toBe(true);
    expect(evidence.failures).toEqual([]);
    expect(evidence.catalogues.catalogueCount).toBe(43);
    expect(evidence.catalogues.englishKeyCount).toBeGreaterThan(0);
    expect(evidence.catalogues.completeSourceLocales).toEqual(["en", "ro"]);
    expect(evidence.catalogues.maxTechnicalFallbackKeysPerLocale).toBe(129);
    expect(evidence.catalogues.completeSourceMissingByLocale).toEqual({});
    expect(evidence.catalogues.overBudgetLocales).toEqual({});
    expect(Object.keys(evidence.catalogues.technicalFallbackCountByLocale)).toHaveLength(43);
    expect(Object.keys(evidence.catalogues.extraKeyCountByLocale)).toHaveLength(43);
    expect(evidence.blog.sourceArticleCount).toBeGreaterThan(0);
    expect(evidence.blog.orphanTranslations).toEqual({});
    expect(evidence.hardcodedPublicStrings).toEqual([]);
  });

  it("requires RTL direction and long-text containment for published Stories", () => {
    const evidence = runScanner();
    expect(evidence.layout).toEqual({
      userContentDirectionAuto: true,
      longTextWrap: true,
      minWidthContainment: true,
      overflowContainment: true,
    });
  });

  it("keeps published story content direction-aware at the rendering boundary", () => {
    const storiesPage = readFileSync(
      resolve(process.cwd(), "src/app/[locale]/stories/page.tsx"),
      "utf8",
    );

    expect(storiesPage.match(/dir="auto"/g)).toHaveLength(2);
    expect(storiesPage).toContain("[overflow-wrap:anywhere]");
    expect(storiesPage).toContain("min-w-0");
    expect(storiesPage).toContain("overflow-hidden");
  });
});
