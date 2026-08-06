import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const runner = readFileSync(
  resolve(process.cwd(), "scripts/run-v1-09-2-1-accessibility-audit.mjs"),
  "utf8",
);
const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/v1-09-2-1-accessibility-audit.yml"),
  "utf8",
);

describe("V1-09.2.1 accessibility audit contract", () => {
  it("covers guest desktop and mobile routes", () => {
    expect(runner).toContain('name: "desktop"');
    expect(runner).toContain('name: "mobile"');
    expect(runner).toContain('devices["iPhone 13"]');
    expect(runner).toContain('"/en/home"');
    expect(runner).toContain('"/en/explore"');
    expect(runner).toContain('"/en/login"');
    expect(runner).toContain('"/en/register"');
  });

  it("runs axe and records keyboard, focus, reduced-motion and dialog evidence", () => {
    expect(runner).toContain("window.axe.run");
    expect(runner).toContain('page.keyboard.press("Tab")');
    expect(runner).toContain(":focus-visible");
    expect(runner).toContain('reducedMotion: "reduce"');
    expect(runner).toContain('[role="dialog"]');
    expect(runner).toContain('page.keyboard.press("Escape")');
  });

  it("keeps axe audit-only and publishes reproducible evidence", () => {
    expect(workflow).toContain("npm ci --legacy-peer-deps");
    expect(workflow).toContain("npm install --no-save --legacy-peer-deps axe-core@4.10.3");
    expect(workflow).toContain("upload-artifact@v4");
    expect(workflow).toContain("retention-days: 90");
    expect(runner).toContain('baselineType: "AUTOMATED_AUDIT_NOT_SIGN_OFF"');
    expect(runner).toContain("accessibilitySignOff: false");
  });

  it("fails infrastructure errors without turning discovered violations into false closure", () => {
    expect(runner).toContain("if (fatalCount > 0) process.exitCode = 1");
    expect(runner).not.toContain("if (violationCount > 0) process.exitCode = 1");
  });
});
