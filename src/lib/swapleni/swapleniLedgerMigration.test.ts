import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730220000_v1_02_r8_canonical_swapleni_ledger.sql",
);
const epochPath = join(
  process.cwd(),
  "supabase",
  "migration-governance",
  "forward-epoch.json",
);

function sql() {
  return readFileSync(migrationPath, "utf8").replace(/\s+/g, " ");
}

describe("V1-02-R8 canonical Swapleni ledger", () => {
  it("registers the migration in the forward-only epoch", () => {
    const epoch = JSON.parse(readFileSync(epochPath, "utf8")) as {
      forward_migrations: Array<Record<string, string>>;
    };
    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730220000_v1_02_r8_canonical_swapleni_ledger.sql",
      version: "20260730220000",
      name: "v1_02_r8_canonical_swapleni_ledger",
      kind: "FORWARD_ONLY",
    });
  });

  it("creates an append-only ledger and derived accounts", () => {
    const migration = sql();
    expect(migration).toContain("create table if not exists public.swapleni_ledger");
    expect(migration).toContain("create table if not exists public.swapleni_accounts");
    expect(migration).toContain("idempotency_key text not null unique");
    expect(migration).toContain("prevent_swapleni_ledger_update");
    expect(migration).toContain("prevent_swapleni_ledger_delete");
    expect(migration).toContain("compensating reversal event");
  });

  it("imports legacy rows exactly once and reconciles profile counters", () => {
    const migration = sql();
    expect(migration).toContain("imported_from_legacy_id uuid unique");
    expect(migration).toContain("'legacy-user-tokens:' || legacy_row.id::text");
    expect(migration).toContain("on conflict (idempotency_key) do nothing");
    expect(migration).toContain("set token_balance = account_row.balance::integer");
    expect(migration).toContain("lifetime_tokens = account_row.lifetime_earned::integer");
    expect(migration).toContain("'{tokens}'");
  });

  it("keeps Swapleni separate from trust and rank", () => {
    const migration = sql();
    expect(migration).not.toContain("trust_score =");
    expect(migration).not.toContain("trust_level =");
    expect(migration).not.toContain("'{reputation}'");
  });

  it("requires service authority and global idempotency for writes", () => {
    const migration = sql();
    expect(migration).toContain("function public.post_swapleni_event_v1");
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain("Service authority required");
    expect(migration).toContain("grant execute on function public.post_swapleni_event_v1");
    expect(migration).not.toMatch(/grant execute on function public\.post_swapleni_event_v1[^;]+to authenticated/);
  });

  it("supports compensating reversals without mutating history", () => {
    const migration = sql();
    expect(migration).toContain("function public.reverse_swapleni_event_v1");
    expect(migration).toContain("reversal_of uuid unique");
    expect(migration).toContain("-original_row.amount");
    expect(migration).toContain("'reversal'");
  });

  it("removes direct legacy writes while retaining owner-scoped reads", () => {
    const migration = sql();
    expect(migration).toContain(
      "revoke insert, update, delete, truncate, references, trigger on table public.user_tokens from public, anon, authenticated",
    );
    expect(migration).toContain("create policy swapleni_ledger_owner_select");
    expect(migration).toContain("create policy swapleni_accounts_owner_select");
    expect(migration).toContain("grant select on table public.swapleni_ledger to authenticated");
  });
});
