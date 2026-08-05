import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type GlobalUiEvidence = {
  pass: boolean;
  failures: string[];
  catalogues: {
    catalogueCount: number;
    englishKeyCount: number;
    missingByLocale: Record<string, string[]>;
    extraByLocale: Record<string, string[]>;
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
  const output = execFileSync(
    process.execPath,
    [resolve(process.cwd(), "scripts/check-global-ui-completeness.mjs")],
    { encoding: "utf8" },
  );
  return JSON.parse(output) as GlobalUiEvidence;
}

describe("V1-08.3 global UI completeness", () => {
  it("produces deterministic PASS evidence for catalogues, Blog and public strings", () => {
    const evidence = runScanner();

    expect(evidence.pass).toBe(true);
    expect(evidence.failures).toEqual([]);
    expect(evidence.catalogues.catalogueCount).toBe(43);
    expect(evidence.catalogues.englishKeyCount).toBeGreaterThan(0);
    expect(evidence.catalogues.missingByLocale).toEqual({});
    expect(evidence.catalogues.extraByLocale).toEqual({});
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
