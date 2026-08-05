import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805165000_v1_07_9_swapleni_policy_authority.sql",
  ),
  "utf8",
);

describe("V1-07.9 Swapleni policy authority", () => {
  it("keeps numeric reward policies inactive until explicit configuration", () => {
    expect(migration).toContain("create table if not exists public.swapleni_reward_policies");
    expect(migration).toContain("active boolean not null default false");
    expect(migration).toContain("Swapleni reward policy is not active");
    expect(migration).toContain("insert into public.swapleni_reward_policies");
    expect(migration).toMatch(/'story_publication'[\s\S]*?0,[\s\S]*?0,[\s\S]*?false/i);
    expect(migration).toMatch(/'blog_contribution'[\s\S]*?0,[\s\S]*?0,[\s\S]*?false/i);
  });

  it("supports only Story publication and approved Blog contribution sources", () => {
    expect(migration).toContain("'story_publication', 'blog_contribution'");
    expect(migration).toContain("story_row.status = 'published'");
    expect(migration).toContain("story_row.visibility = 'public'");
    expect(migration).toContain("story_row.dispute_suppressed is false");
    expect(migration).toContain("contribution_row.status = 'approved'");
  });

  it("enforces one deterministic reward per user and immutable source", () => {
    expect(migration).toContain("v1-07-reward:%s:%s:%s");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("ledger_row.idempotency_key = v_key");
    expect(migration).toContain("'replayed', true");
  });

  it("enforces per-user window caps against unreversed rewards", () => {
    expect(migration).toContain("per_user_window_cap");
    expect(migration).toContain("window_days");
    expect(migration).toContain("Swapleni reward cap exceeded");
    expect(migration).toContain("reversal_row.reversal_of = ledger_row.id");
  });

  it("uses compensating reversals only after a source becomes ineligible", () => {
    expect(migration).toContain("function public.reverse_v1_07_swapleni_reward_v1");
    expect(migration).toContain("Eligible source cannot be reversed");
    expect(migration).toContain("public.reverse_swapleni_event_v1");
    expect(migration).toContain("v1-07-reversal:%s");
  });

  it("keeps all policy, award and reversal authority server-only", () => {
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain("to service_role");
    expect(migration).toContain("from public, anon, authenticated");
  });

  it("does not couple Swapleni rewards to Trust", () => {
    expect(migration).not.toContain("calculate_trust_score");
    expect(migration).not.toMatch(/update\s+public\.profiles\s+set\s+trust/i);
    expect(migration).not.toContain("trust_level");
  });
});
