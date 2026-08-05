import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805010000_v1_07_6_blog_editorial_authority.sql",
  ),
  "utf8",
);

describe("V1-07.6 Blog editorial authority", () => {
  it("persists the finite editorial lifecycle and revision", () => {
    expect(migration).toContain("editorial_status text");
    expect(migration).toContain("revision integer not null default 1");
    expect(migration).toContain("'draft', 'review', 'published', 'archived'");
  });

  it("keeps public access limited to published posts", () => {
    expect(migration).toContain("create policy blog_posts_public_read");
    expect(migration).toContain(
      "editorial_status = 'published' and published is true",
    );
  });

  it("uses service-role-only server authority with a hardened search path", () => {
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain("set search_path = pg_catalog, pg_temp");
    expect(migration).toContain(
      "grant execute on function public.transition_blog_post_v1(uuid, integer, text) to service_role",
    );
    expect(migration).toContain(
      "revoke all on function public.transition_blog_post_v1(uuid, integer, text) from authenticated",
    );
  });

  it("validates every RPC input before reading or mutating state", () => {
    expect(migration).toContain("if p_post_id is null then");
    expect(migration).toContain(
      "if p_expected_revision is null or p_expected_revision < 1 then",
    );
    expect(migration).toContain(
      "if p_target_status is null or p_target_status not in",
    );
  });

  it("fails closed on stale revisions and invalid transitions", () => {
    expect(migration).toContain(
      "v_post.revision is distinct from p_expected_revision",
    );
    expect(migration).toContain("blog_editorial_stale_revision");
    expect(migration).toContain("blog_editorial_invalid_transition");
    expect(migration).toContain("for update");
  });

  it("supports same-state and lost-response replay without another mutation", () => {
    expect(migration).toContain("v_current_status = p_target_status");
    expect(migration).toContain(
      "v_post.revision in (p_expected_revision, p_expected_revision + 1)",
    );
    expect(migration).toContain("return v_post;");

    const replayGuard = migration.indexOf(
      "v_post.revision in (p_expected_revision, p_expected_revision + 1)",
    );
    const staleGuard = migration.indexOf(
      "v_post.revision is distinct from p_expected_revision",
    );
    expect(replayGuard).toBeGreaterThan(-1);
    expect(staleGuard).toBeGreaterThan(replayGuard);
  });

  it("does not mix Blog with Stories, feedback or Swapleni", () => {
    expect(migration).not.toContain("story_publications");
    expect(migration).not.toContain("blog_feedback");
    expect(migration).not.toContain("swapleni_ledger");
  });
});
