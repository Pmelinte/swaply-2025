import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function batchSql() {
  const files = readdirSync(migrationDirectory)
    .filter((name) => name.includes("_batch_62_1_review_"))
    .sort();

  expect(files.length).toBeGreaterThanOrEqual(7);
  return files
    .map((file) => readFileSync(join(migrationDirectory, file), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");
}

describe("Batch 62.1 canonical Review authority", () => {
  it("uses Reviews as the only persisted exchange feedback table", () => {
    const migrationFiles = readdirSync(migrationDirectory);
    expect(
      migrationFiles.some((name) => name.endsWith("_create_swap_feedback.sql")),
    ).toBe(false);

    const sql = batchSql();
    expect(sql).toContain("alter table public.reviews");
    expect(sql).toContain("reviews_reviewer_idempotency_key_unique");
    expect(sql).not.toContain("create table public.swap_feedback");
    expect(sql).not.toContain("create table public.feedback");
  });

  it("derives identity and counterparty from the authenticated completed Swap", () => {
    const sql = batchSql();
    expect(sql).toContain("v_actor_id uuid := auth.uid()");
    expect(sql).toContain("from public.swaps where id = p_swap_id for update");
    expect(sql).toContain("v_swap.status <> 'completed'");
    expect(sql).toContain("v_actor_id = v_swap.requester_id");
    expect(sql).toContain("v_reviewed_id := v_swap.responder_id");
    expect(sql).toContain("Actor is not a swap participant");
  });

  it("allows at most one immutable review per participant with replay semantics", () => {
    const sql = batchSql();
    expect(sql).toContain("unique index if not exists reviews_reviewer_idempotency_key_unique");
    expect(sql).toContain("where swap_id = p_swap_id and reviewer_id = v_actor_id for update");
    expect(sql).toContain("v_review.request_hash = v_hash");
    expect(sql).toContain("'replayed', true");
    expect(sql).toContain("Review already submitted with different content");
  });

  it("blocks direct browser writes and exposes only authenticated RPCs", () => {
    const sql = batchSql();
    expect(sql).toContain("revoke all on table public.reviews from public, anon, authenticated");
    expect(sql).toContain("grant select on table public.reviews to anon, authenticated");
    expect(sql).toContain("v_authority is distinct from 'submit_swap_review_v1'");
    expect(sql).toContain("v_authority is distinct from 'respond_to_swap_review_v1'");
    expect(sql).toContain("Direct review inserts are forbidden");
    expect(sql).toContain("Direct review updates are forbidden");
    expect(sql).toContain("grant execute on function public.submit_swap_review_v1");
    expect(sql).toContain("to authenticated");
    expect(sql).toContain("from public, anon, service_role");
  });

  it("lets only the reviewed participant update the response field", () => {
    const sql = batchSql();
    expect(sql).toContain("function public.respond_to_swap_review_v1");
    expect(sql).toContain("v_review.reviewed_id <> v_actor_id");
    expect(sql).toContain("Only the reviewed participant may respond");
    expect(sql).toContain("Only the review response may be updated");
  });
});
