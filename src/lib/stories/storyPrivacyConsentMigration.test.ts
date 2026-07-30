import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730205500_v1_02_r7_stories_privacy_consent_foundation.sql",
);

const correctionPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260730211500_v1_02_r7_1_story_privacy_filter_and_republish_fix.sql",
);

const epochPath = join(
  process.cwd(),
  "supabase",
  "migration-governance",
  "forward-epoch.json",
);

function migrationSql() {
  return readFileSync(migrationPath, "utf8").replace(/\s+/g, " ");
}

function correctionSql() {
  return readFileSync(correctionPath, "utf8").replace(/\s+/g, " ");
}

describe("V1-02-R7 Stories privacy and consent migration", () => {
  it("registers the foundation and its forward-only verification correction", () => {
    const epoch = JSON.parse(readFileSync(epochPath, "utf8")) as {
      forward_only_after_version: string;
      forward_migrations: Array<{
        path: string;
        version: string;
        name: string;
        kind: string;
      }>;
    };

    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730205500_v1_02_r7_stories_privacy_consent_foundation.sql",
      version: "20260730205500",
      name: "v1_02_r7_stories_privacy_consent_foundation",
      kind: "FORWARD_ONLY",
    });
    expect(epoch.forward_migrations).toContainEqual({
      path: "supabase/migrations/20260730211500_v1_02_r7_1_story_privacy_filter_and_republish_fix.sql",
      version: "20260730211500",
      name: "v1_02_r7_1_story_privacy_filter_and_republish_fix",
      kind: "FORWARD_ONLY",
    });
    expect("20260730205500" > epoch.forward_only_after_version).toBe(true);
    expect("20260730211500" > "20260730205500").toBe(true);
  });

  it("keeps Stories separate from Blog and ties drafts to completed swaps", () => {
    const sql = migrationSql();

    expect(sql).toContain("create table if not exists public.stories");
    expect(sql).toContain("create table if not exists public.story_participants");
    expect(sql).toContain("create table if not exists public.story_revisions");
    expect(sql).toContain("create table if not exists public.story_consents");
    expect(sql).toContain("create table if not exists public.story_moderation");
    expect(sql).toContain("create table if not exists public.story_publications");
    expect(sql).toContain("and status = 'completed'");
    expect(sql).not.toContain("blog_posts");
    expect(sql).not.toContain("blog_suggestions");
  });

  it("requires revision-bound consent from every participant", () => {
    const sql = migrationSql();

    expect(sql).toContain(
      "foreign key (story_id, revision) references public.story_revisions(story_id, revision)",
    );
    expect(sql).toContain("consent_status text not null check (consent_status in ('granted', 'withdrawn'))");
    expect(sql).toContain("participant_count <> granted_count");
    expect(sql).toContain("All participants must consent to this revision");
    expect(sql).toContain("delete from public.story_consents where story_id = p_story_id");
    expect(sql).toContain("delete from public.story_moderation where story_id = p_story_id");
  });

  it("withdraws public visibility immediately when consent is withdrawn", () => {
    const sql = migrationSql();

    expect(sql).toContain("if not p_granted then");
    expect(sql).toContain("withdrawn_at = clock_timestamp()");
    expect(sql).toContain("set is_visible = false");
    expect(sql).toContain("where story_id = p_story_id and is_visible");
  });

  it("blocks publication without moderation or when a dispute is active", () => {
    const sql = migrationSql();

    expect(sql).toContain("Approved moderation required");
    expect(sql).toContain("Story publication blocked by dispute");
    expect(sql).toContain("create trigger suppress_stories_on_dispute");
    expect(sql).toContain("set status = 'disputed'");
    expect(sql).toContain("dispute_suppressed = true");
  });

  it("rejects contact details, coordinate pairs and exact street addresses", () => {
    const initial = migrationSql();
    const correction = correctionSql();

    expect(initial).toContain("function private.story_content_is_safe_v1");
    expect(initial).toContain("Story contains private contact, exact location or coordinate data");
    expect(correction).toContain("[A-Z0-9._%+-]+@[A-Z0-9.-]+");
    expect(correction).toContain("[0-9]{1,2}\\.[0-9]{4,}");
    expect(correction).toContain("(?:^|[^[:alnum:]_])(?:street|st\\.|strada|str\\.|avenue");
    expect(correction).not.toContain("\\b(?:street");
  });

  it("stores immutable revision snapshots and can restore a withdrawn current snapshot", () => {
    const initial = migrationSql();
    const correction = correctionSql();

    expect(initial).toContain("primary key (story_id, revision)");
    expect(initial).toContain("Append-only public Story snapshots");
    expect(correction).toContain("on conflict (story_id, revision) do update");
    expect(correction).toContain("is_visible = true");
    expect(correction).toContain("hidden_at = null");
    expect(correction).not.toContain("delete from public.story_publications");
    expect(initial).not.toContain("alter table public.story_publications add column user_id");
    expect(initial).not.toContain("alter table public.story_publications add column participant_id");
  });

  it("allows only RLS-scoped reads and server-authority writes", () => {
    const sql = migrationSql();

    expect(sql).toContain("alter table public.stories enable row level security");
    expect(sql).toContain("create policy stories_participant_select");
    expect(sql).toContain("create policy story_publications_public_select");
    expect(sql).toContain("using (is_visible)");
    expect(sql).toContain("revoke all on table public.story_consents from public, anon, authenticated");
    expect(sql).toContain("grant select on table public.story_publications to anon, authenticated");
    expect(sql).not.toContain("grant insert on table public.stories");
    expect(sql).not.toContain("grant update on table public.story_consents");
  });

  it("does not expose the workflow RPCs to anonymous callers", () => {
    const sql = `${migrationSql()} ${correctionSql()}`;

    expect(sql).toContain("grant execute on function public.create_story_draft_v1(uuid, text, text) to authenticated");
    expect(sql).toContain("grant execute on function public.set_story_consent_v1(uuid, integer, boolean) to authenticated");
    expect(sql).toContain("grant execute on function public.publish_story_revision_v1(uuid, integer, text) to authenticated");
    expect(sql).not.toMatch(/grant execute on function public\.[^(]+\([^;]+\) to anon/);
  });
});
