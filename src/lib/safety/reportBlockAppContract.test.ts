import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("Batch 63.3 application contract", () => {
  it("uses canonical RPCs instead of direct report and block writes", () => {
    const safetyActions = source("src/lib/state/useSafetyActions.ts");
    expect(safetyActions).toContain("submitSafetyReport");
    expect(safetyActions).toContain("setUserBlock");
    expect(safetyActions).not.toContain('.from("reports").insert');
    expect(safetyActions).not.toContain('.from("blocked_users").insert');
    expect(safetyActions).not.toContain('.from("blocked_users").delete');
  });

  it("loads persisted blocks and changes UI state only after RPC success", () => {
    const safetyActions = source("src/lib/state/useSafetyActions.ts");
    expect(safetyActions).toContain('.from("blocked_users")');
    expect(safetyActions).toContain('.select("blocked_id")');
    expect(safetyActions).toContain("if (!result.ok)");
    expect(safetyActions.indexOf("if (!result.ok)")).toBeLessThan(
      safetyActions.indexOf("setBlockedUsers((previous)"),
    );
  });

  it("uses public.reports throughout the admin report workflow", () => {
    const page = source("src/app/[locale]/admin/reports/page.tsx");
    const actions = source("src/features/admin/useAdminActions.ts");
    const stats = source("src/app/api/admin/stats/route.ts");
    expect(page).toContain('.from("reports")');
    expect(page).not.toContain("abuse_reports");
    expect(actions).toContain("resolveSafetyReport");
    expect(actions).not.toContain("abuse_reports");
    expect(stats).toContain('.from("reports")');
    expect(stats).not.toContain("abuse_reports");
  });
});
