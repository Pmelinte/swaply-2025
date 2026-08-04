import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const foundationPath = join(
  process.cwd(),
  "supabase/migrations/20260730205500_v1_02_r7_stories_privacy_consent_foundation.sql",
);
const republishFixPath = join(
  process.cwd(),
  "supabase/migrations/20260730211500_v1_02_r7_1_story_privacy_filter_and_republish_fix.sql",
);
const moderationGuardPath = join(
  process.cwd(),
  "supabase/migrations/20260805002000_v1_07_4_story_moderation_requires_bilateral_consent.sql",
);

const foundationSql = readFileSync(foundationPath, "utf8");
const republishFixSql = readFileSync(republishFixPath, "utf8");
const moderationGuardSql = readFileSync(moderationGuardPath, "utf8");
const lifecycleSql = `${foundationSql}\n${republishFixSql}\n${moderationGuardSql}`;

describe("V1-07.4 Stories authoritative lifecycle", () => {
  it("keeps the complete server-authoritative RPC surface", () => {
    for (const rpc of [
      "create_story_draft_v1",
      "save_story_revision_v1",
      "set_story_consent_v1",
      "moderate_story_revision_v1",
      "publish_story_revision_v1",
    ]) {
      expect(lifecycleSql).toContain(`function public.${rpc}`);
      expect(lifecycleSql).toMatch(
        new RegExp(`function public\\.${rpc}[\\s\\S]*?security definer`, "i"),
      );
    }
  });

  it("requires a completed participant exchange before draft creation", () => {
    expect(foundationSql).toContain("status = 'completed'");
    expect(foundationSql).toContain("caller_id in (requester_id, responder_id)");
    expect(foundationSql).toContain("Completed participant swap required");
  });

  it("enforces one Story per exchange and bilateral participant roles", () => {
    expect(foundationSql).toContain("unique (swap_id)");
    expect(foundationSql).toContain("participant_role in ('author', 'partner')");
    expect(foundationSql).toContain("unique (story_id, participant_role)");
  });

  it("fails stale revisions and resets consent, moderation and publication", () => {
    expect(foundationSql).toContain("current_revision = p_expected_revision");
    expect(foundationSql).toContain("Story revision is stale or caller is not the author");
    expect(foundationSql).toContain("delete from public.story_consents");
    expect(foundationSql).toContain("delete from public.story_moderation");
    expect(foundationSql).toContain("set is_visible = false");
  });

  it("requires bilateral consent inside the moderation RPC", () => {
    expect(moderationGuardSql).toContain("current_status_value <> 'pending_moderation'");
    expect(moderationGuardSql).toContain("participant_count <> 2");
    expect(moderationGuardSql).toContain("granted_count <> participant_count");
    expect(moderationGuardSql).toContain(
      "Bilateral Story consent required before moderation",
    );
  });

  it("keeps moderation restricted to moderator or service authority", () => {
    expect(moderationGuardSql).toContain("auth.role() <> 'service_role'");
    expect(moderationGuardSql).toContain("private.is_story_moderator_v1");
    expect(moderationGuardSql).toContain("Moderator authority required");
  });

  it("publishes only safe public snapshots", () => {
    expect(lifecycleSql).toContain("private.story_content_is_safe_v1");
    expect(lifecycleSql).toContain("story_publications");
    expect(lifecycleSql).toContain("public_slug");
    expect(lifecycleSql).toContain("visibility = 'public'");
  });

  it("suppresses publication when a dispute is active", () => {
    expect(lifecycleSql).toContain("private.story_has_active_dispute_v1");
    expect(lifecycleSql).toContain("dispute_suppressed");
    expect(lifecycleSql).toMatch(/status\s*=\s*'disputed'/i);
    expect(lifecycleSql).toMatch(/is_visible\s*=\s*false/i);
  });

  it("keeps all six Story relations under RLS", () => {
    for (const table of [
      "stories",
      "story_participants",
      "story_revisions",
      "story_consents",
      "story_moderation",
      "story_publications",
    ]) {
      expect(lifecycleSql).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("keeps private and participant projections out of public publication", () => {
    expect(foundationSql).toContain("visibility in ('private', 'participants', 'public')");
    expect(lifecycleSql).toContain("visibility = 'public'");
    expect(lifecycleSql).not.toContain("visibility = 'community'");
  });
});
