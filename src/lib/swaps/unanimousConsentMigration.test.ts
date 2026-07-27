import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260727072000_e3_2_revision_unanimous_consent.sql"),
  "utf8",
);

describe("E3.2 revision-safe consent migration", () => {
  it("uses security-definer RPCs with an explicit search path", () => {
    expect(migration).toContain("create or replace function public.revise_swap_agreement");
    expect(migration).toContain("create or replace function public.accept_swap_revision");
    expect(migration.match(/security definer/g)?.length).toBe(2);
    expect(migration.match(/set search_path = pg_catalog, public/g)?.length).toBe(2);
  });

  it("enforces expected-revision CAS and stale-revision rejection", () => {
    expect(migration).toContain("current_swap.agreement_revision <> expected_revision");
    expect(migration).toContain("and agreement_revision = expected_revision");
    expect(migration).toContain("Stale agreement revision");
    expect(migration).toContain("errcode = '40001'");
  });

  it("keeps acceptance participant-only and idempotent", () => {
    expect(migration).toContain("participant.user_id = actor_id");
    expect(migration).toContain("participant.state = 'active'");
    expect(migration).toContain("participant.role <> 'observer'");
    expect(migration).toContain("on conflict (swap_id, participant_id, revision) do nothing");
  });

  it("counts only current-revision active consent and accepts atomically", () => {
    expect(migration).toContain("acceptance.revision = expected_revision");
    expect(migration).toContain("accepted_total = required_total");
    expect(migration).toContain("required_total >= 2");
    expect(migration).toContain("set status = 'accepted'");
    expect(migration).toContain("and status = 'pending'");
  });

  it("does not grant table writes to authenticated users", () => {
    expect(migration).not.toMatch(/grant\s+(insert|update|delete|all).*swap_revision_acceptances/i);
    expect(migration).toContain("grant execute on function public.revise_swap_agreement");
    expect(migration).toContain("grant execute on function public.accept_swap_revision");
  });
});
