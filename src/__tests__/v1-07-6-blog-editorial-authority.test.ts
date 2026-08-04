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

  it("uses service-role-only server authority", () => {
    expect(migration).toContain("auth.role() <> 'service_role'");
    expect(migration).toContain(
      "grant execute on function public.transition_blog_post_v1(uuid, integer, text) to service_role",
    );
    expect(migration).toContain(
      "revoke all on function public.transition_blog_post_v1(uuid, integer, text) from authenticated",
    );
  });

  it("fails closed on stale revisions and invalid transitions", () => {
    expect(migration).toContain("blog_editorial_stale_revision");
    expect(migration).toContain("blog_editorial_invalid_transition");
    expect(migration).toContain("for update");
  });

  it("supports idempotent replay without incrementing revision", () => {
    expect(migration).toContain("if v_current_status = p_target_status then");
    expect(migration).toContain("return v_post;");
  });

  it("does not mix Blog with Stories, feedback or Swapleni", () => {
    expect(migration).not.toContain("story_publications");
    expect(migration).not.toContain("blog_feedback");
    expect(migration).not.toContain("swapleni_ledger");
  });
});
