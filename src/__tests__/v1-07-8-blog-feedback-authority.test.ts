import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805120000_v1_07_8_blog_feedback_authority.sql",
  ),
  "utf8",
);

describe("V1-07.8 Blog feedback and suggestion authority", () => {
  it("persists feedback and suggestions separately from Blog posts", () => {
    expect(migration).toContain("create table if not exists public.blog_contributions");
    expect(migration).toContain("contribution_type in ('feedback', 'suggestion')");
    expect(migration).toContain("references public.blog_posts(id) on delete set null");
  });

  it("requires authenticated server-authoritative submission", () => {
    expect(migration).toContain("function public.submit_blog_contribution_v1");
    expect(migration).toContain("Authentication required");
    expect(migration).toContain("Published Blog post not found");
    expect(migration).toContain("Direct Blog contribution inserts are forbidden");
  });

  it("keeps retries idempotent and serializes concurrent identical submissions", () => {
    expect(migration).toContain("unique (contributor_id, idempotency_key)");
    expect(migration).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(migration).toContain("pg_catalog.hashtextextended");
    expect(migration).toContain("Blog contribution idempotency conflict");
    expect(migration).toContain("'replayed', true");
  });

  it("fails closed when update authority is absent or unexpected", () => {
    expect(migration).toContain(
      "v_authority is distinct from 'moderate_blog_contribution_v1'",
    );
    expect(migration).toContain(
      "v_authority is distinct from 'withdraw_blog_contribution_v1'",
    );
    expect(migration).toContain("Direct Blog contribution updates are forbidden");
  });

  it("moderates only through service authority with revision checks", () => {
    expect(migration).toContain("function public.moderate_blog_contribution_v1");
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain("Blog contribution stale revision");
    expect(migration).toContain("v_target not in ('approved', 'rejected')");
    expect(migration).toContain("for update");
  });

  it("allows owner withdrawal while preserving immutable history", () => {
    expect(migration).toContain("function public.withdraw_blog_contribution_v1");
    expect(migration).toContain("Only the contributor may withdraw");
    expect(migration).toContain("status = 'withdrawn'");
    expect(migration).toContain("Blog contribution history is immutable");
  });

  it("keeps contribution rows private and table grants least-privileged", () => {
    expect(migration).toContain("alter table public.blog_contributions enable row level security");
    expect(migration).toContain("create policy blog_contributions_owner_read");
    expect(migration).toContain("contributor_id = auth.uid()");
    expect(migration).toContain(
      "revoke all on table public.blog_contributions from public, anon, authenticated",
    );
    expect(migration).toContain(
      "grant select on table public.blog_contributions to authenticated",
    );
  });

  it("cannot publish Blog content or change Trust and Swapleni directly", () => {
    expect(migration).not.toMatch(/update\s+public\.blog_posts/i);
    expect(migration).not.toContain("calculate_trust_score");
    expect(migration).not.toContain("swapleni_ledger");
    expect(migration).not.toContain("credit_swapleni");
  });
});
