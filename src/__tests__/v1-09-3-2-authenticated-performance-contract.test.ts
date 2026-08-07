import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("V1-09.3.2 authenticated constrained performance contract", () => {
  it("measures the intended authenticated route set under mobile and constrained conditions", () => {
    const runner = read("scripts/run-v1-09-3-2-authenticated-performance.mjs");

    for (const route of [
      "/en",
      "/en/objects",
      "/en/matching",
      "/en/messages",
      "/en/exchange",
      "/en/profile",
    ]) {
      expect(runner).toContain(`path: \"${route}\"`);
    }

    expect(runner).toContain("width: 390");
    expect(runner).toContain("height: 844");
    expect(runner).toContain("CPU_THROTTLING_RATE = 4");
    expect(runner).toContain("latencyMs: 150");
    expect(runner).toContain("downloadKbps: 1600");
    expect(runner).toContain("uploadKbps: 750");
    expect(runner).toContain("Network.emulateNetworkConditions");
    expect(runner).toContain("Emulation.setCPUThrottlingRate");
  });

  it("uses the existing dedicated E2E identity and remains read-only", () => {
    const runner = read("scripts/run-v1-09-3-2-authenticated-performance.mjs");
    const workflow = read(".github/workflows/v1-09-3-2-authenticated-performance.yml");

    expect(runner).toContain("E2E_USER_A_EMAIL");
    expect(runner).toContain("E2E_USER_A_PASSWORD");
    expect(runner).toContain("/api/tokens/balance");
    expect(runner).not.toMatch(/\.post\(|\.put\(|\.patch\(|\.delete\(/);

    expect(workflow).toContain("secrets.E2E_USER_A_EMAIL");
    expect(workflow).toContain("secrets.E2E_USER_A_PASSWORD");
    expect(workflow).toContain("vars.NEXT_PUBLIC_SUPABASE_URL");
    expect(workflow).toContain("vars.NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(workflow).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(workflow).not.toContain("STRIPE_SECRET_KEY");
  });

  it("states the measurement boundary instead of claiming field INP", () => {
    const runner = read("scripts/run-v1-09-3-2-authenticated-performance.mjs");

    expect(runner).toContain("does not claim field INP");
    expect(runner).toContain("Slow external-provider fallback is not proven");
    expect(runner).toContain("real-user distributions");
  });
});
