import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "supabase", "migrations");

function cancelMigration() {
  const file = readdirSync(directory)
    .filter((name) => name.endsWith("_batch_63_1_cancel_authority.sql"))
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(directory, file!), "utf8").replace(/\s+/g, " ");
}

describe("Batch 63.1 canonical cancel migration", () => {
  it("creates private request and exactly-once effect registries", () => {
    const sql = cancelMigration();
    expect(sql).toContain("create table if not exists public.swap_cancel_requests");
    expect(sql).toContain("unique (actor_id, idempotency_key)");
    expect(sql).toContain("create table if not exists public.swap_cancel_effects");
    expect(sql).toContain("swap_id uuid primary key");
    expect(sql).toContain("revoke all on table public.swap_cancel_requests from public, anon, authenticated");
    expect(sql).toContain("revoke all on table public.swap_cancel_effects from public, anon, authenticated");
  });

  it("makes cancel_swap_v1 the only cancellation authority", () => {
    const sql = cancelMigration();
    expect(sql).toContain("function public.cancel_swap_v1");
    expect(sql).toContain("Cancellation requires cancel_swap_v1");
    expect(sql).toContain("'swaply.cancel_authority', 'cancel_swap_v1'");
    expect(sql).toContain("'cancel_authority'");
    expect(sql).toContain("grant execute on function public.cancel_swap_v1(uuid, text, text, text) to authenticated");
  });

  it("uses participant authorization, CAS and idempotent replay", () => {
    const sql = cancelMigration();
    expect(sql).toContain("for update");
    expect(sql).toContain("Actor is not a swap participant");
    expect(sql).toContain("Only the requester may cancel a pending swap");
    expect(sql).toContain("Stale swap status: expected %, current %");
    expect(sql).toContain("Idempotency key conflict");
    expect(sql).toContain("'{replayed}'");
  });

  it("reactivates only items locked by the cancelled swap contract", () => {
    const sql = cancelMigration();
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain("is_active = true");
    expect(sql).toContain("status = 'reserved' and lock_reason = 'swap_active'");
    expect(sql).toContain("reactivated_item_count");
  });

  it("clears incomplete completion state and closes the linked conversation", () => {
    const sql = cancelMigration();
    expect(sql).toContain("requester_confirmed = false");
    expect(sql).toContain("responder_confirmed = false");
    expect(sql).toContain("delete from public.swap_completion_confirmations");
    expect(sql).toContain("set status = 'cancelled'");
    expect(sql).toContain("status in ('active', 'agreed')");
  });

  it("counts and recalculates trust only after acceptance", () => {
    const sql = cancelMigration();
    expect(sql).toContain("v_cancellation_counted := p_expected_status in ('accepted', 'in_progress')");
    expect(sql).toContain("swaps_cancelled = coalesce(swaps_cancelled, 0) + 1");
    expect(sql).toContain("perform public.calculate_trust_score(v_actor_id)");
  });

  it("creates two deduplicated notifications without reward or review effects", () => {
    const sql = cancelMigration();
    expect(sql).toContain("'notification_count', 2");
    expect(sql).toContain("on conflict (dedupe_key) where dedupe_key is not null do nothing");
    expect(sql).not.toContain("award_tokens(");
    expect(sql).not.toContain("insert into public.reviews");
  });
});
