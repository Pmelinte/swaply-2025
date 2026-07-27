import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260727070000_e3_1_multi_user_exchange_model.sql",
  "utf8",
);

describe("E3.1 multi-user migration", () => {
  it("is additive and preserves the legacy swaps table", () => {
    expect(migration).toContain("create table if not exists public.swap_participants");
    expect(migration).toContain("create table if not exists public.swap_legs");
    expect(migration).toContain("create table if not exists public.swap_revision_acceptances");
    expect(migration).toContain("add column if not exists exchange_kind");
    expect(migration).not.toMatch(/drop table\s+public\.swaps/i);
  });

  it("keeps browser writes closed until E3.2", () => {
    expect(migration).toContain("alter table public.swap_participants enable row level security");
    expect(migration).toContain("alter table public.swap_legs enable row level security");
    expect(migration).toContain("alter table public.swap_revision_acceptances enable row level security");
    expect(migration).not.toMatch(/for\s+(insert|update|delete)\s+to\s+authenticated/i);
  });

  it("provides participant-only reads and outsider exclusion", () => {
    expect(migration).toContain("create or replace function public.is_swap_participant");
    expect(migration).toContain("participant.user_id = auth.uid()");
    expect(migration).toContain("auth.uid() in (swap.requester_id, swap.responder_id)");
    expect(migration).toContain("using (public.is_swap_participant(swap_id))");
  });

  it("stores revision-bound acceptance evidence", () => {
    expect(migration).toContain("revision integer not null check (revision >= 1)");
    expect(migration).toContain("unique (swap_id, participant_id, revision)");
  });
});
