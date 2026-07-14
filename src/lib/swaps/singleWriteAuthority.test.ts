import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260714211500_batch_61_2_single_swap_write_authority.sql",
  ),
  "utf8",
);

describe("Batch 61.2 single Swap lifecycle write authority", () => {
  it("blocks direct status writes outside the canonical function", () => {
    expect(migration).toContain("Swap status writes must use transition_swap_lifecycle()");
    expect(migration).toContain("swaply.lifecycle_write_authorized");
  });

  it("uses row locking and compare-and-swap", () => {
    expect(migration).toMatch(/for update;/i);
    expect(migration).toContain("lifecycle_version <> p_expected_version");
    expect(migration).toContain("lifecycle_version = p_expected_version");
    expect(migration).toContain("Concurrent swap lifecycle update detected");
  });

  it("persists a private idempotency ledger", () => {
    expect(migration).toContain("create table if not exists public.swap_transition_requests");
    expect(migration).toContain("unique (actor_id, idempotency_key)");
    expect(migration).toContain("idempotent_replay");
    expect(migration).toContain(
      "revoke all on table public.swap_transition_requests from anon, authenticated",
    );
  });

  it("keeps authorization inside the atomic database function", () => {
    expect(migration).toContain("v_actor_id uuid := auth.uid()");
    expect(migration).toContain("v_actor_id <> v_swap.requester_id");
    expect(migration).toContain("v_actor_id <> v_swap.responder_id");
    expect(migration).toContain(
      "grant execute on function public.transition_swap_lifecycle(uuid, text, bigint, text) to authenticated",
    );
  });
});
