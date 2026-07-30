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

  it("allows only the legitimate post-completion dispute transition", () => {
    const sql = migrationSql();

    expect(sql).toContain(
      "check (opened_from_status in ('accepted', 'in_progress', 'completed'))",
    );
    expect(sql).toContain(
      "p_expected_status not in ('accepted', 'in_progress', 'completed')",
    );
    expect(sql).toContain("when 'completed' then p_to_status = 'disputed'");
    expect(sql).not.toContain(
      "when 'completed' then p_to_status in ('cancelled', 'disputed')",
    );
  });

  it("uses complete explicit definitions without dynamic SQL", () => {
    const sql = migrationSql();

    expect(sql.match(/create or replace function public\.apply_swap_transition_v1/g)).toHaveLength(1);
    expect(sql.match(/create or replace function public\.open_swap_dispute_v1/g)).toHaveLength(1);
    expect(sql).toContain("v_effects_applied boolean := false");
    expect(sql).toContain("public.apply_swap_completion_effects_v1");
    expect(sql).toContain("public.swap_dispute_requests");
    expect(sql).toContain("public.swap_dispute_effects");
    expect(sql).not.toContain("pg_catalog.pg_get_functiondef");
    expect(sql).not.toMatch(/\bexecute\s+function_definition\b/i);
    expect(sql).not.toContain("pg_catalog.replace(");
  });

  it("preserves authority, idempotency and least-privilege boundaries", () => {
    const sql = migrationSql();

    expect(sql).toContain("Actor is not a swap participant");
    expect(sql).toContain("Stale swap status");
    expect(sql).toContain("Idempotency key conflict");
    expect(sql).toContain("Dispute command conflict");
    expect(sql).toContain(
      "revoke execute on function public.apply_swap_transition_v1",
    );
    expect(sql).toContain(
      "revoke execute on function public.open_swap_dispute_v1",
    );
    expect(sql).toContain("to authenticated");
    expect(sql).not.toMatch(/grant execute[^;]+to anon/i);
    expect(sql).not.toMatch(/grant execute[^;]+to public/i);
  });

  it("does not alter trust, Swapleni or unrelated business data", () => {
    const sql = migrationSql();

    expect(sql).not.toContain("trust_score =");
    expect(sql).not.toContain("trust_level =");
    expect(sql).not.toContain("swapleni_ledger");
    expect(sql).not.toContain("swapleni_accounts");
  });
});
