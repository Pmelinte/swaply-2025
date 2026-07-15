import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "supabase", "migrations");

function closureMigration() {
  const file = readdirSync(directory)
    .filter((name) => name.endsWith("_batch_62_3_authenticated_e2e_cleanup.sql"))
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(directory, file!), "utf8").replace(/\s+/g, " ");
}

describe("Batch 62.3 authenticated C3 closure migration", () => {
  it("keeps the E2E account registry private and empty by default", () => {
    const sql = closureMigration();

    expect(sql).toContain("create table if not exists public.c3_e2e_test_accounts");
    expect(sql).toContain("alter table public.c3_e2e_test_accounts enable row level security");
    expect(sql).toContain("revoke all on table public.c3_e2e_test_accounts from public, anon, authenticated");
    expect(sql).not.toContain("insert into public.c3_e2e_test_accounts");
  });

  it("allows cleanup only when both Swap participants are privately registered", () => {
    const sql = closureMigration();

    expect(sql).toContain("function public.cleanup_c3_e2e_fixture_v1");
    expect(sql).toContain("Actor is not a swap participant");
    expect(sql).toContain("v_registered_participants <> 2");
    expect(sql).toContain("Cleanup is restricted to registered C3 E2E participants");
    expect(sql).toContain("grant execute on function public.cleanup_c3_e2e_fixture_v1(uuid) to authenticated");
  });

  it("validates exact C3 cardinality before deleting immutable-ID effects", () => {
    const sql = closureMigration();

    expect(sql).toContain("v_reward_rows <> 2");
    expect(sql).toContain("v_reward_amount <> 60");
    expect(sql).toContain("v_requester_reward <> 30");
    expect(sql).toContain("v_responder_reward <> 30");
    expect(sql).toContain("v_notification_rows <> 4");
    expect(sql).toContain("Completed C3 E2E fixture effects are incomplete");
  });

  it("removes only rows linked by the immutable Swap identifier and restores caches", () => {
    const sql = closureMigration();

    expect(sql).toContain("where source_type = 'swap' and source_id = p_swap_id");
    expect(sql).toContain("where reference_id = p_swap_id and reason = 'swap_completed'");
    expect(sql).toContain("delete from public.swaps where id = p_swap_id");
    expect(sql).toContain("perform public.refresh_review_reputation_v1(v_swap.requester_id)");
    expect(sql).toContain("perform public.refresh_review_reputation_v1(v_swap.responder_id)");
  });

  it("uses PostgreSQL GREATEST expressions without invalid schema qualification", () => {
    const sql = closureMigration();

    expect(sql).toContain("swaps_completed = greatest(");
    expect(sql).toContain("pg_catalog.to_jsonb( greatest(");
    expect(sql).not.toContain("pg_catalog.greatest");
  });
});
