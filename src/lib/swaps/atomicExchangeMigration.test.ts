import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260727074000_e3_3_circular_bundle_atomic_activation.sql",
);
const migration = fs.readFileSync(migrationPath, "utf8");

describe("E3.3 atomic exchange migration", () => {
  it("creates explicit reservation evidence with one active reservation per item", () => {
    expect(migration).toContain("create table if not exists public.swap_item_reservations");
    expect(migration).toContain("swap_item_reservations_one_active_item_idx");
    expect(migration).toContain("where state = 'active'");
  });

  it("keeps participant visibility read-only", () => {
    expect(migration).toContain("alter table public.swap_item_reservations enable row level security");
    expect(migration).toContain("for select");
    expect(migration).toContain("public.is_swap_participant(swap_id)");
    expect(migration).not.toMatch(/for\s+(insert|update|delete)/i);
  });

  it("exposes only the guarded activation RPC to authenticated users", () => {
    expect(migration).toContain("create or replace function public.activate_atomic_exchange");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = pg_catalog, public");
    expect(migration).toContain(
      "grant execute on function public.activate_atomic_exchange(uuid, integer) to authenticated",
    );
  });

  it("requires expected revision, unanimous consent and proposer authority", () => {
    expect(migration).toContain("current_swap.agreement_revision <> expected_revision");
    expect(migration).toContain("accepted_total <> required_total");
    expect(migration).toContain("Only the active proposer can activate the exchange");
  });

  it("validates every leg and item before any reservation write", () => {
    const validationPosition = migration.indexOf("Exchange legs or items are not activation-safe");
    const insertPosition = migration.indexOf("insert into public.swap_item_reservations");
    expect(validationPosition).toBeGreaterThan(-1);
    expect(insertPosition).toBeGreaterThan(validationPosition);
    expect(migration).toContain("item.owner_id <> source_participant.user_id");
    expect(migration).toContain("item.is_active is not true");
  });

  it("moves every leg and the swap only after complete reservation", () => {
    expect(migration).toContain("reservation_total <> leg_total");
    expect(migration).toContain("set state = 'reserved'");
    expect(migration).toContain("set status = 'in_progress'");
  });
});
