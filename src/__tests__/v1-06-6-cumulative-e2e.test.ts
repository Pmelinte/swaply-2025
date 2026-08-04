import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/v1-06-6-cumulative-e2e.yml"),
  "utf8",
);

describe("V1-06.6 cumulative journey closure gate", () => {
  it("runs repository, browser and authenticated authority gates on one head", () => {
    expect(workflow).toContain("Repository and V1-06 contract gate");
    expect(workflow).toContain("Browser, mobile, 43 locales, LTR, RTL and PWA gate");
    expect(workflow).toContain(
      "Authenticated authority, negative branches and rollback cleanup",
    );
    expect(workflow).toContain("actions/checkout@v4");
  });

  it("replays every V1-06 implementation contract", () => {
    for (const contract of [
      "journey-return.test.ts",
      "swap-proposal-email.test.ts",
      "notification-contract.test.ts",
      "global-first-context.test.ts",
      "mobile-pwa-contract.test.ts",
    ]) {
      expect(workflow).toContain(contract);
    }
  });

  it("keeps the global-first and mobile browser evidence cumulative", () => {
    expect(workflow).toContain("e2e/public-visual-audit.spec.ts");
    expect(workflow).toContain("e2e/i18n-43-locales.spec.ts");
    expect(workflow).toContain("e2e/v1-05-6-domain-cumulative.spec.ts");
    expect(workflow).toContain("--project=chromium");
    expect(workflow).toContain("actions/upload-artifact@v4");
  });

  it("inherits authenticated cross-domain, negative and completion authority", () => {
    for (const replay of [
      "v1_05_4_6_domain_aware_exchange_completion_replay.sql",
      "v1_05_4_6_1_completion_readiness_hardening_replay.sql",
      "v1_05_4_7_cross_domain_e2e_replay.sql",
      "v1_05_6_event_object_e2e_replay.sql",
    ]) {
      expect(workflow).toContain(replay);
    }
    expect(workflow).toContain("--set ON_ERROR_STOP=1");
  });

  it("uses rollback-only fixtures and strict immutable cleanup", () => {
    expect(workflow).toContain("Verify immutable fixture cleanup");
    expect(workflow).toContain(
      "V1-06.6 rollback cleanup left deterministic fixture data.",
    );
    expect(workflow).toContain("supabase stop --no-backup");
    expect(workflow).not.toContain("SUPABASE_ACCESS_TOKEN");
    expect(workflow).not.toContain("production fixture");
  });

  it("does not activate paid or commercial providers", () => {
    expect(workflow).not.toContain("RESEND_API_KEY");
    expect(workflow).not.toContain("STRIPE_SECRET_KEY");
    expect(workflow).not.toContain("OPENAI_API_KEY");
  });
});
