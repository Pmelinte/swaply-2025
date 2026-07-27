import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260727080000_e3_4_multi_user_lifecycle.sql"),
  "utf8",
);

describe("E3.4 migration safety", () => {
  it("uses one revision-safe server authority for leg progression", () => {
    expect(migration).toContain("create or replace function public.confirm_swap_leg_progress");
    expect(migration).toContain("current_swap.agreement_revision <> expected_revision");
    expect(migration).toContain("for update");
    expect(migration).toContain("security definer");
  });

  it("keeps sender and receiver authority separate", () => {
    expect(migration).toContain("Only the sending participant can confirm dispatch");
    expect(migration).toContain("Only the receiving participant can confirm receipt");
    expect(migration).toContain("leg.state = 'sender_confirmed'");
  });

  it("completes only after every leg is fulfilled and no leg is blocked", () => {
    expect(migration).toContain("fulfilled_total = leg_total");
    expect(migration).toContain("leg.state in ('disputed', 'cancelled')");
    expect(migration).toContain("set status = 'completed'");
  });

  it("does not add browser table writes or unrelated side effects", () => {
    expect(migration).not.toMatch(/create policy[\s\S]*for (insert|update|delete)/i);
    expect(migration).not.toContain("notifications");
    expect(migration).not.toContain("reputation");
    expect(migration).not.toContain("token");
  });
});
