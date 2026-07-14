import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function batchMigration() {
  const file = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith("_batch_61_2_single_swap_transition_authority.sql"))
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(migrationDirectory, file!), "utf8");
}

describe("Batch 61.2 single transition authority migration", () => {
  it("creates a private idempotency registry", () => {
    const sql = batchMigration();
    expect(sql).toContain("create table if not exists public.swap_transition_requests");
    expect(sql).toContain("unique (actor_id, idempotency_key)");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain(
      "revoke all on table public.swap_transition_requests from public, anon, authenticated",
    );
  });

  it("uses one row-locking compare-and-set authority", () => {
    const normalized = batchMigration().replace(/\s+/g, " ");
    expect(normalized).toContain("function public.apply_swap_transition_v1");
    expect(normalized).toContain("where id = p_swap_id for update");
    expect(normalized).toContain(
      "v_swap.status is distinct from p_expected_status",
    );
    expect(normalized).toContain("using errcode = '40001'");
    expect(normalized).toContain("function public.transition_swap_v1");
  });

  it("blocks direct status updates and restricts RPC execution", () => {
    const normalized = batchMigration().replace(/\s+/g, " ");
    expect(normalized).toContain(
      "Direct swap status updates are forbidden; use transition_swap_v1",
    );
    expect(normalized).toContain(
      "current_setting('swaply.transition_authority', true)",
    );
    expect(normalized).toContain(
      "grant execute on function public.transition_swap_v1(uuid, text, text, text) to authenticated",
    );
    expect(normalized).toContain(
      "revoke execute on function public.apply_swap_transition_v1",
    );
  });

  it("routes automatic expiry through the same primitive", () => {
    const normalized = batchMigration().replace(/\s+/g, " ");
    expect(normalized).toContain("function public.expire_old_swaps()");
    expect(normalized).toContain(
      "perform public.apply_swap_transition_v1( v_swap.id, 'pending', 'expired'",
    );
  });

  it("does not invent the absent swap_bundles table", () => {
    expect(batchMigration()).not.toContain("swap_bundles");
  });
});
