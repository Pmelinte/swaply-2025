import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const directory = join(process.cwd(), "supabase", "migrations");

function postCompletionMigration() {
  const file = readdirSync(directory)
    .filter((name) => name.endsWith("_batch_62_2_post_completion_effects.sql"))
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(directory, file!), "utf8");
}

describe("Batch 62.2 post-completion effects migration", () => {
  it("creates a private exactly-once post-completion registry without backfill", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("create table if not exists public.swap_post_completion_effects");
    expect(sql).toContain("swap_id uuid primary key");
    expect(sql).toContain("on conflict (swap_id) do nothing");
    expect(sql).toContain("Historical completed Swaps are intentionally not backfilled");
    expect(sql).not.toContain("insert into public.swap_post_completion_effects select");
  });

  it("awards exactly 30 Swapleni once to each participant", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("perform public.award_tokens( v_swap.requester_id, 30, 'swap_completed', p_swap_id )");
    expect(sql).toContain("perform public.award_tokens( v_swap.responder_id, 30, 'swap_completed', p_swap_id )");
    expect(sql).toContain("check (reward_per_participant = 30)");
    expect(sql).toContain("Profile is required for token award");
  });

  it("increments touched-user completion counters and recalculates trust", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("swaps_completed = coalesce(swaps_completed, 0) + 1");
    expect(sql).toContain("'{completedSwaps}'");
    expect(sql).toContain("perform public.calculate_trust_score(v_swap.requester_id)");
    expect(sql).toContain("perform public.calculate_trust_score(v_swap.responder_id)");
    expect(sql).toContain("'{reputation}'");
  });

  it("creates localized and deduplicated completion and feedback notifications", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("notifications_dedupe_key_unique");
    expect(sql).toContain("'tokenReasons.swap_completed'");
    expect(sql).toContain("'notificationSettings.type_feedback_requested'");
    expect(sql).toContain("'notificationSettings.type_feedback_requested_desc'");
    expect(sql).toContain("on conflict (dedupe_key) where dedupe_key is not null do nothing");
    expect(sql).toContain("'notification_count', 4");
  });

  it("keeps structural and post-completion effects in the same transaction", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("function public.apply_swap_completion_effects_v1");
    expect(sql).toContain("v_post_applied := public.apply_swap_post_completion_effects_v1");
    expect(sql).toContain("Post-completion effects were not applied");
    expect(sql).toContain("'post_completion_effects_applied', v_post_applied");
  });

  it("updates rating and trust only after a new canonical Review insert", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("function public.refresh_review_reputation_v1");
    expect(sql).toContain("from public.reviews where reviewed_id = p_user_id");
    expect(sql).toContain("rating_count = v_rating_count");
    expect(sql).toContain("after insert on public.reviews");
    expect(sql).toContain("perform public.calculate_trust_score(p_user_id)");
  });

  it("makes is_read canonical while preserving legacy read writers", () => {
    const sql = postCompletionMigration().replace(/\s+/g, " ");
    expect(sql).toContain("function public.sync_notification_read_state_v1");
    expect(sql).toContain("new.is_read := v_read");
    expect(sql).toContain("new.read := v_read");
    expect(sql).toContain("before insert or update of read, is_read, read_at");
  });
});
