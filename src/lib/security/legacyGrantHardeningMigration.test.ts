import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730223500_v1_02_r9_legacy_least_privilege_grant_hardening.sql",
);
const epochPath = join(
  process.cwd(),
  "supabase",
  "migration-governance",
  "forward-epoch.json",
);

function sql() {
  return readFileSync(migrationPath, "utf8").replace(/\s+/g, " ").toLowerCase();
}

describe("V1-02-R9 legacy least-privilege grant hardening", () => {
  it("registers the migration in the forward-only epoch", () => {
    const epoch = JSON.parse(readFileSync(epochPath, "utf8")) as {
      forward_migrations: Array<Record<string, string>>;
    };

    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730223500_v1_02_r9_legacy_least_privilege_grant_hardening.sql",
      version: "20260730223500",
      name: "v1_02_r9_legacy_least_privilege_grant_hardening",
      kind: "FORWARD_ONLY",
    });
  });

  it("removes privileges that bypass or exceed row-level policy intent", () => {
    const migration = sql();
    expect(migration).toContain(
      "revoke truncate, references, trigger on table %s from anon, authenticated",
    );
    expect(migration).not.toMatch(/grant\s+(truncate|references|trigger)/);
  });

  it("rebuilds authenticated CRUD from existing RLS policy commands", () => {
    const migration = sql();
    expect(migration).toContain("from pg_policies policy_row");
    expect(migration).toContain(
      "policy_row.roles && array['public', 'authenticated']::name[]",
    );
    expect(migration).toContain(
      "values ('select'), ('insert'), ('update'), ('delete')",
    );
    expect(migration).toContain(
      "grant %s on table %s to authenticated",
    );
  });

  it("limits anonymous access to the declared public surface", () => {
    const migration = sql();
    expect(migration).toContain(
      "revoke select, insert, update, delete on table %s from anon",
    );
    expect(migration).toContain("grant select on table public.items to anon");
    expect(migration).toContain(
      "grant select on table public.public_profiles to anon",
    );
    expect(migration).toContain(
      "grant select on table public.story_publications to anon",
    );
    expect(migration).toContain(
      "grant insert on table public.item_analytics to anon",
    );
    expect(migration).not.toContain("grant select on table public.user_tokens to anon");
    expect(migration).not.toContain("grant select on table public.audit_log to anon");
  });

  it("does not alter RLS policies, service authority, data or trust", () => {
    const migration = sql();
    expect(migration).not.toMatch(/create\s+policy|alter\s+policy|drop\s+policy/);
    expect(migration).not.toMatch(/revoke[^;]+from\s+service_role/);
    expect(migration).not.toMatch(/insert\s+into|update\s+public\.|delete\s+from/);
    expect(migration).not.toContain("trust_score");
    expect(migration).not.toContain("trust_level");
  });
});
