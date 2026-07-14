import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function migration(suffix: string) {
  const file = readdirSync(migrationDirectory)
    .filter((name) => name.endsWith(suffix))
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(migrationDirectory, file!), "utf8");
}

function authorityMigration() {
  return migration("_batch_61_2_single_swap_transition_authority.sql");
}

function bridgeMigration() {
  return migration("_batch_61_2_transition_guard_bridge.sql");
}

function markerResetMigration() {
  return migration("_batch_61_2_authority_marker_reset_hardening.sql");
}

function reconciliationMigration() {
  return migration("_batch_61_2_parallel_authority_reconciliation.sql");
}

function lateReconciliationMigration() {
  return migration("_batch_61_2_late_parallel_reconciliation.sql");
}

describe("Batch 61.2 single transition authority migrations", () => {
  it("creates a private idempotency registry", () => {
    const sql = authorityMigration();
    expect(sql).toContain(
      "create table if not exists public.swap_transition_requests",
    );
    expect(sql).toContain("unique (actor_id, idempotency_key)");
    expect(sql).toContain("enable row level security");
    expect(sql).toContain(
      "revoke all on table public.swap_transition_requests from public, anon, authenticated",
    );
  });

  it("uses one row-locking compare-and-set authority", () => {
    const normalized = authorityMigration().replace(/\s+/g, " ");
    expect(normalized).toContain("function public.apply_swap_transition_v1");
    expect(normalized).toContain("where id = p_swap_id for update");
    expect(normalized).toContain(
      "v_swap.status is distinct from p_expected_status",
    );
    expect(normalized).toContain("using errcode = '40001'");
    expect(normalized).toContain("function public.transition_swap_v1");
  });

  it("restricts public execution to the authenticated RPC", () => {
    const normalized = authorityMigration().replace(/\s+/g, " ");
    expect(normalized).toContain(
      "grant execute on function public.transition_swap_v1(uuid, text, text, text) to authenticated",
    );
    expect(normalized).toContain(
      "revoke execute on function public.apply_swap_transition_v1",
    );
  });

  it("routes automatic expiry through the same primitive", () => {
    const normalized = authorityMigration().replace(/\s+/g, " ");
    expect(normalized).toContain("function public.expire_old_swaps()");
    expect(normalized).toContain(
      "perform public.apply_swap_transition_v1( v_swap.id, 'pending', 'expired'",
    );
  });

  it("routes authenticated legacy writes through the same authority", () => {
    const normalized = bridgeMigration().replace(/\s+/g, " ");
    expect(normalized).toContain(
      "perform public.apply_swap_transition_v1( old.id, old.status, new.status, auth.uid(), 'direct_update_compat'",
    );
    expect(normalized).toContain(
      "perform set_config('swaply.transition_authority', '', true)",
    );
    expect(normalized).toContain("return null");
  });

  it("rejects privileged direct status updates outside the authority", () => {
    const normalized = bridgeMigration().replace(/\s+/g, " ");
    expect(normalized).toContain("if auth.uid() is null then");
    expect(normalized).toContain(
      "Direct privileged swap status updates are forbidden",
    );
  });

  it("clears the transaction-local authority marker immediately", () => {
    const normalized = markerResetMigration().replace(/\s+/g, " ");
    const reset =
      "perform pg_catalog.set_config('swaply.transition_authority', '', true)";
    expect(normalized).toContain(reset);
    expect(normalized.indexOf("set status = p_to_status")).toBeLessThan(
      normalized.indexOf(reset),
    );
    expect(normalized.indexOf(reset)).toBeLessThan(
      normalized.indexOf("insert into public.swap_events"),
    );
  });

  it("removes the first accidental parallel authority but keeps identity immutable", () => {
    const normalized = reconciliationMigration().replace(/\s+/g, " ");
    expect(normalized).toContain(
      "drop function if exists public.transition_swap_status_authoritative",
    );
    expect(normalized).toContain(
      "drop table if exists public.swap_transition_authority_config",
    );
    expect(normalized).toContain(
      "create trigger aab_require_swap_identity_immutable",
    );
    expect(normalized).toContain("and status = 'pending'");
  });

  it("reconciles a late duplicate branch back to the canonical contract", () => {
    const normalized = lateReconciliationMigration().replace(/\s+/g, " ");
    expect(normalized).toContain(
      "drop trigger if exists aaa_require_swap_transition_authority",
    );
    expect(normalized).toContain(
      "drop function if exists public.transition_swap_status_authoritative",
    );
    expect(normalized).toContain(
      "drop table if exists public.swap_transition_authority_config",
    );
    expect(normalized).toContain(
      "create or replace function public.transition_swap_v1",
    );
    expect(normalized).toContain(
      "create or replace function public.apply_swap_transition_v1",
    );
    expect(normalized).toContain(
      "revoke execute on function public.apply_swap_transition_v1",
    );
    expect(normalized).toContain(
      "grant execute on function public.transition_swap_v1",
    );
    expect(normalized).toContain(
      "create trigger aab_require_swap_identity_immutable",
    );
  });

  it("keeps the marker reset before event insertion after late reconciliation", () => {
    const normalized = lateReconciliationMigration().replace(/\s+/g, " ");
    const reset =
      "perform pg_catalog.set_config('swaply.transition_authority', '', true)";
    expect(normalized.indexOf("set status = p_to_status")).toBeLessThan(
      normalized.indexOf(reset),
    );
    expect(normalized.indexOf(reset)).toBeLessThan(
      normalized.indexOf("insert into public.swap_events"),
    );
  });

  it("does not invent the absent swap_bundles table in the final authority", () => {
    expect(authorityMigration()).not.toContain("swap_bundles");
    expect(bridgeMigration()).not.toContain("swap_bundles");
    expect(markerResetMigration()).not.toContain("swap_bundles");
    expect(reconciliationMigration()).not.toContain("swap_bundles");
    expect(lateReconciliationMigration()).not.toContain("swap_bundles");
  });
});
