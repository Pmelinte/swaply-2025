import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "supabase", "migrations");

function safetySql() {
  const files = readdirSync(directory)
    .filter((name) => name.includes("_batch_63_3_"))
    .sort();

  expect(files).toHaveLength(7);
  return files
    .map((file) => readFileSync(join(directory, file), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");
}

describe("Batch 63.3 canonical report and block migrations", () => {
  it("keeps reports and blocked_users as the only public safety sources", () => {
    const sql = safetySql();
    expect(sql).toContain("drop table public.abuse_reports");
    expect(sql).toContain("alter table public.reports");
    expect(sql).toContain("alter table public.blocked_users");
    expect(sql).toContain("create table if not exists public.safety_command_requests");
    expect(sql).toContain("create table if not exists public.safety_report_resolution_effects");
  });

  it("removes unverified automatic sanctions and direct browser writes", () => {
    const sql = safetySql();
    expect(sql).toContain("drop trigger if exists on_report_update_counts");
    expect(sql).toContain("drop function if exists public.handle_report_count_update");
    expect(sql).toContain("Direct report writes are forbidden");
    expect(sql).toContain("Direct block writes are forbidden");
    expect(sql).toContain("revoke all on table public.reports from public, anon, authenticated");
    expect(sql).toContain("revoke all on table public.blocked_users from public, anon, authenticated");
  });

  it("submits one authenticated idempotent canonical report", () => {
    const sql = safetySql();
    expect(sql).toContain("function public.submit_safety_report_v1");
    expect(sql).toContain("Users cannot report themselves or their own items");
    expect(sql).toContain("Daily report limit reached");
    expect(sql).toContain("An active report already exists for this target");
    expect(sql).toContain("'safety.report_submitted'");
    expect(sql).toContain("grant execute on function public.submit_safety_report_v1");
  });

  it("resolves reports atomically through moderator authority", () => {
    const sql = safetySql();
    expect(sql).toContain("function public.resolve_safety_report_v1");
    expect(sql).toContain("Only admins or moderators may resolve reports");
    expect(sql).toContain("Stale report status: expected %, current %");
    expect(sql).toContain("'warning_issued'");
    expect(sql).toContain("'item_hidden'");
    expect(sql).toContain("'user_suspended'");
    expect(sql).toContain("insert into public.safety_report_resolution_effects");
    expect(sql).toContain("normalize_safety_moderation_action_v1");
    expect(sql).toContain("new.action := 'suspend_user'");
  });

  it("blocks and unblocks without deleting history or notifying the target", () => {
    const sql = safetySql();
    expect(sql).toContain("function public.set_user_block_v1");
    expect(sql).toContain("Users cannot block themselves");
    expect(sql).toContain("set status = 'refused'");
    expect(sql).toContain("'safety.user_blocked'");
    expect(sql).toContain("'safety.user_unblocked'");
    expect(sql).not.toContain("delete from public.messages");
    expect(sql).not.toContain("delete from public.conversations");
  });

  it("enforces the bilateral contact barrier at every creation boundary", () => {
    const sql = safetySql();
    expect(sql).toContain("enforce_unblocked_matching_interest_v1");
    expect(sql).toContain("on public.matching_interests");
    expect(sql).toContain("enforce_unblocked_conversation_v1");
    expect(sql).toContain("on public.conversations");
    expect(sql).toContain("enforce_unblocked_message_v1");
    expect(sql).toContain("on public.messages");
    expect(sql).toContain("enforce_unblocked_swap_v1");
    expect(sql).toContain("on public.swaps");
  });

  it("does not create rewards, Reviews, Stories or trust changes", () => {
    const sql = safetySql();
    expect(sql).not.toContain("award_tokens(");
    expect(sql).not.toContain("insert into public.user_tokens");
    expect(sql).not.toContain("insert into public.reviews");
    expect(sql).not.toContain("insert into public.blog_posts");
    expect(sql).not.toContain("calculate_trust_score(");
  });
});
