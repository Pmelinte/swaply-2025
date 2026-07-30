import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730235700_v1_02_r10_2_allow_completed_dispute_effect_status.sql",
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

describe("V1-02-R10.2 completed dispute effect source status", () => {
  it("registers the migration as forward-only", () => {
    const epoch = JSON.parse(readFileSync(epochPath, "utf8")) as {
      forward_migrations: Array<Record<string, string>>;
    };

    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730235700_v1_02_r10_2_allow_completed_dispute_effect_status.sql",
      version: "20260730235700",
      name: "v1_02_r10_2_allow_completed_dispute_effect_status",
      kind: "FORWARD_ONLY",
    });
  });

  it("allows only the three canonical dispute source statuses", () => {
    const sql = migrationSql();

    expect(sql).toContain(
      "check (from_status in ('accepted', 'in_progress', 'completed'))",
    );
    expect(sql).not.toContain("'pending'");
    expect(sql).not.toContain("'cancelled'");
    expect(sql).not.toContain("'rejected'");
    expect(sql).not.toContain("'expired'");
    expect(sql).not.toContain("'disputed'");
  });

  it("changes only the named check constraint", () => {
    const sql = migrationSql();

    expect(sql).toContain(
      "alter table public.swap_dispute_effects drop constraint if exists swap_dispute_effects_from_status_check",
    );
    expect(sql).toContain(
      "add constraint swap_dispute_effects_from_status_check",
    );
    expect(sql).not.toContain("create or replace function");
    expect(sql).not.toContain("grant ");
    expect(sql).not.toContain("revoke ");
    expect(sql).not.toContain("update public.");
    expect(sql).not.toContain("insert into public.");
    expect(sql).not.toContain("delete from public.");
  });

  it("does not touch trust, Swapleni, Stories, or participant authority", () => {
    const sql = migrationSql();

    expect(sql).not.toContain("trust_score");
    expect(sql).not.toContain("trust_level");
    expect(sql).not.toContain("swapleni_");
    expect(sql).not.toContain("stories");
    expect(sql).not.toContain("open_swap_dispute_v1");
    expect(sql).not.toContain("apply_swap_transition_v1");
  });
});
