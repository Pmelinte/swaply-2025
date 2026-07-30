import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730234500_v1_02_r10_1_align_completed_dispute_transition_guard.sql",
);
const epochPath = join(
  process.cwd(),
  "supabase",
  "migration-governance",
  "forward-epoch.json",
);

function migrationSql() {
  return readFileSync(migrationPath, "utf8").replace(/\s+/g, " ");
}

describe("V1-02-R10.1 completed dispute transition guard", () => {
  it("registers the migration as forward-only", () => {
    const epoch = JSON.parse(readFileSync(epochPath, "utf8")) as {
      forward_migrations: Array<Record<string, string>>;
    };

    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730234500_v1_02_r10_1_align_completed_dispute_transition_guard.sql",
      version: "20260730234500",
      name: "v1_02_r10_1_align_completed_dispute_transition_guard",
      kind: "FORWARD_ONLY",
    });
  });

  it("permits only completed to disputed", () => {
    const sql = migrationSql();

    expect(sql).toContain(
      "if old.status = 'completed' and new.status <> 'disputed' then",
    );
    expect(sql).toContain(
      "if old.status in ('rejected', 'cancelled', 'expired', 'disputed') then",
    );
    expect(sql).not.toContain(
      "if old.status in ('completed', 'rejected', 'cancelled', 'expired', 'disputed') then",
    );
  });

  it("preserves canonical authority checks", () => {
    const sql = migrationSql();

    expect(sql).toContain("Cancellation requires cancel_swap_v1");
    expect(sql).toContain("Dispute opening requires open_swap_dispute_v1");
    expect(sql).toContain("apply_swap_transition_v1");
    expect(sql).toContain("Direct privileged swap status updates are forbidden");
    expect(sql).toContain("auth.uid()");
  });

  it("does not change grants, trust or Swapleni", () => {
    const sql = migrationSql();

    expect(sql).not.toMatch(/\bgrant\b/i);
    expect(sql).not.toContain("trust_score");
    expect(sql).not.toContain("trust_level");
    expect(sql).not.toContain("swapleni_ledger");
    expect(sql).not.toContain("swapleni_accounts");
  });
});
