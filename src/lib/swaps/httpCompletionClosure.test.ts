import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(...segments: string[]) {
  return readFileSync(join(process.cwd(), ...segments), "utf8");
}

describe("Batch 61.4 HTTP completion closure", () => {
  it("normalizes the idempotency key before validating it", () => {
    const route = source(
      "src",
      "app",
      "api",
      "swaps",
      "[id]",
      "complete",
      "route.ts",
    );

    expect(route).toContain('request.headers.get("idempotency-key")');
    expect(route).toContain('body.idempotencyKey ??');
    expect(route).toContain(").trim();");
    expect(route).toContain('error: "Idempotency key is required"');
  });

  it("catches confirmation exceptions and uses localized shared copy", () => {
    const component = source(
      "src",
      "components",
      "exchange",
      "ExchangeConfirmation.tsx",
    );

    expect(component).toContain('const common = useTranslations("common")');
    expect(component).toContain("} catch (error) {");
    expect(component).toContain("setConfirmationError(true)");
    expect(component).toContain('common("errorOccurred")');
    expect(component).toContain('common("tryAgain")');
    expect(component).not.toContain(
      "The confirmation could not be saved. Please try again.",
    );
  });

  it("keeps the HTTP race as the terminal authenticated Train C project", () => {
    const config = source("playwright.two-user.config.ts");
    const workflow = source(
      ".github",
      "workflows",
      "two-user-auth-e2e.yml",
    );

    expect(config).toContain('name: "bilateral-completion-http"');
    expect(config).toContain("bilateral-completion-http.spec.ts");
    expect(config).toContain('dependencies: ["bilateral-match-agreement"]');
    expect(workflow).toContain("--project=bilateral-completion-http");
  });
});
