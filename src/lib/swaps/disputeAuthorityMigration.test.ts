import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "supabase", "migrations");

function disputeMigrations() {
  const files = readdirSync(directory)
    .filter((name) => name.includes("_batch_63_2_dispute_"))
    .sort();

  expect(files).toHaveLength(4);
  return files
    .map((file) => readFileSync(join(directory, file), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");
}

describe("Batch 63.2 canonical dispute migrations", () => {
  it("creates one canonical dispute graph and private effect registries", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("create table if not exists public.disputes");
    expect(sql).toContain("create unique index if not exists disputes_swap_unique_idx");
    expect(sql).toContain("create table if not exists public.dispute_evidence");
    expect(sql).toContain("create table if not exists public.swap_dispute_requests");
    expect(sql).toContain("create table if not exists public.swap_dispute_effects");
    expect(sql).toContain("create table if not exists public.swap_dispute_resolution_effects");
  });

  it("keeps browser storage read-only and participant-scoped", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("create policy disputes_select_participants");
    expect(sql).toContain("create policy dispute_evidence_select_participants");
    expect(sql).toContain("revoke all on table public.disputes from public, anon, authenticated");
    expect(sql).toContain("grant select on table public.disputes to authenticated");
    expect(sql).toContain("revoke all on table public.swap_dispute_requests from public, anon, authenticated");
  });

  it("reserves disputed for open_swap_dispute_v1", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("Dispute opening requires open_swap_dispute_v1");
    expect(sql).toContain("'swaply.dispute_authority', 'open_swap_dispute_v1'");
    expect(sql).toContain("'disputed', v_actor_id, 'dispute_authority'");
    expect(sql).toContain("grant execute on function public.open_swap_dispute_v1");
  });

  it("opens atomically with participant authorization, CAS and replay", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("function public.open_swap_dispute_v1");
    expect(sql).toContain("Actor is not a swap participant");
    expect(sql).toContain("Stale swap status: expected %, current %");
    expect(sql).toContain("unique (actor_id, idempotency_key)");
    expect(sql).toContain("'{replayed}'");
    expect(sql).toContain("requester_confirmed = false");
    expect(sql).toContain("delete from public.swap_completion_confirmations");
  });

  it("adds evidence only through the participant command", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("function public.add_swap_dispute_evidence_v1");
    expect(sql).toContain("Actor is not a dispute participant");
    expect(sql).toContain("Dispute no longer accepts evidence");
    expect(sql).toContain("Direct dispute evidence writes are forbidden");
    expect(sql).toContain("grant execute on function public.add_swap_dispute_evidence_v1");
  });

  it("resolves locally while the global Swap stays disputed", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("function public.resolve_swap_dispute_v1");
    expect(sql).toContain("Only admins or moderators may resolve disputes");
    expect(sql).toContain("Dispute resolution requires a disputed Swap");
    expect(sql).toContain("'dispute_resolved', 'disputed', 'disputed'");
    expect(sql).not.toContain("p_to_status, 'resolved'");
    expect(sql).not.toContain("set status = 'resolved'");
  });

  it("applies cleanup and trust consequences only at resolution", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("swaps_disputed = coalesce(swaps_disputed, 0) + 1");
    expect(sql).toContain("perform public.calculate_trust_score(v_penalized_user_id)");
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain("status = 'reserved' and lock_reason = 'swap_active'");
    expect(sql).toContain("set status = 'cancelled'");
    expect(sql).toContain("reactivated_item_count");
  });

  it("creates notifications and audit events without rewards, Reviews or Stories", () => {
    const sql = disputeMigrations();
    expect(sql).toContain("'notification_count', 2");
    expect(sql).toContain("on conflict (dedupe_key) where dedupe_key is not null do nothing");
    expect(sql).not.toContain("award_tokens(");
    expect(sql).not.toContain("insert into public.user_tokens");
    expect(sql).not.toContain("insert into public.reviews");
    expect(sql).not.toContain("insert into public.blog_posts");
  });
});
