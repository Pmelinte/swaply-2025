import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730232000_v1_02_r10_completed_swap_dispute_story_closure.sql",
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

describe("V1-02-R10 authenticated RG-13 adversarial closure", () => {
  it("registers the forward-only migration", () => {
    const epoch = JSON.parse(readFileSync(epochPath, "utf8")) as {
      forward_migrations: Array<Record<string, string>>;
    };

    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730232000_v1_02_r10_completed_swap_dispute_story_closure.sql",
      version: "20260730232000",
      name: "v1_02_r10_completed_swap_dispute_story_closure",
      kind: "FORWARD_ONLY",
    });
  });

  it("allows a legitimate post-completion dispute", () => {
    const sql = migrationSql();

    expect(sql).toContain(
      "check (opened_from_status in ('accepted', 'in_progress', 'completed'))",
    );
    expect(sql).toContain(
      "p_expected_status not in (''accepted'', ''in_progress'', ''completed'')",
    );
    expect(sql).toContain(
      "when ''completed'' then p_to_status in (\\n ''disputed''\\n )",
    );
  });

  it("preserves the canonical dispute and transition functions", () => {
    const sql = migrationSql();

    expect(sql).toContain("pg_catalog.pg_get_functiondef");
    expect(sql).toContain(
      "public.open_swap_dispute_v1(uuid,text,text,text,jsonb,text)",
    );
    expect(sql).toContain(
      "public.apply_swap_transition_v1(uuid,text,text,uuid,text,text)",
    );
    expect(sql).toContain("R10 expected open_swap_dispute_v1 status gate was not found");
    expect(sql).toContain("R10 expected apply_swap_transition_v1 transition matrix was not found");
  });

  it("does not weaken unrelated terminal transitions or ordinary grants", () => {
    const sql = migrationSql();

    expect(sql).not.toContain("when ''completed'' then p_to_status in ('cancelled'");
    expect(sql).not.toMatch(/grant execute[^;]+to anon/i);
    expect(sql).not.toMatch(/grant execute[^;]+to public/i);
    expect(sql).not.toContain("trust_score =");
    expect(sql).not.toContain("trust_level =");
    expect(sql).not.toContain("swapleni_ledger");
  });
});
