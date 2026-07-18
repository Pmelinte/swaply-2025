import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationName =
  "20260718190000_batch_65_4_public_profile_projection.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", migrationName),
  "utf8",
);
const sql = migration.replace(/\s+/g, " ").trim();

const syncFunction = sql.slice(
  sql.indexOf("create or replace function public.sync_public_profile()"),
  sql.indexOf(
    "revoke execute on function public.sync_public_profile()",
  ),
);

describe("Batch 65.4 public profile projection migration", () => {
  it("keeps the migration additive and leaves the compatibility write path intact", () => {
    expect(sql).toContain(
      "add column if not exists is_public boolean not null default true",
    );
    expect(sql).not.toContain("drop table public.public_profiles");
    expect(sql).not.toContain("truncate public.public_profiles");
    expect(sql).not.toContain(
      "revoke update on table public.profiles from authenticated",
    );
    expect(sql).not.toContain("drop policy if exists update_own_profile");
  });

  it("binds private identity access to the authenticated actor and real relationships", () => {
    expect(sql).toContain(
      "create or replace function public.profile_identity_allowed_v1( p_target_user_id uuid )",
    );
    expect(sql).toContain("v_actor_id uuid := auth.uid()");
    expect(sql).toContain("v_actor_id = p_target_user_id");
    expect(sql).toContain("r.role in ('moderator', 'admin')");
    expect(sql).toContain("from public.swaps s");
    expect(sql).toContain("from public.conversations c");
    expect(sql).toContain("from public.matches m");
    expect(sql).not.toContain("p_actor_user_id");
  });

  it("requires explicit opt-in before projecting optional personal fields", () => {
    expect(syncFunction).toContain(
      "new.visibility ->> 'showBio', 'false'",
    );
    expect(syncFunction).toContain(
      "new.visibility ->> 'showInterests', 'false'",
    );
    expect(syncFunction).toContain(
      "new.visibility ->> 'showOccupation', 'false'",
    );
    expect(syncFunction).toContain(
      "new.visibility ->> 'showWebsite', 'false'",
    );
    expect(syncFunction).toContain(
      "new.visibility ->> 'showSocialLinks', 'false'",
    );
    expect(syncFunction).toContain(
      "case when v_is_public and v_show_bio then new.bio else null end",
    );
    expect(syncFunction).toContain(
      "case when v_is_public and v_show_occupation then new.occupation else null end",
    );
    expect(syncFunction).toContain(
      "case when v_is_public and v_show_social_links then new.social_links else null end",
    );
  });

  it("projects only approximate city and country location", () => {
    expect(syncFunction).toContain("'city', v_city");
    expect(syncFunction).toContain("'country', v_country");
    expect(syncFunction).not.toContain("latitude");
    expect(syncFunction).not.toContain("longitude");
    expect(syncFunction).not.toContain("address_line");
    expect(syncFunction).not.toContain("postal_code");
  });

  it("keeps public discovery while restricting private rows to allowed identities", () => {
    expect(sql).toContain(
      "create policy public_profiles_read on public.public_profiles for select to anon, authenticated using ( is_public or public.profile_identity_allowed_v1(user_id) )",
    );
    expect(sql).toContain(
      "grant select on table public.public_profiles to anon, authenticated",
    );
    expect(sql).toContain(
      "revoke execute on function public.sync_public_profile() from public, anon, authenticated",
    );
  });

  it("rebuilds the projection without changing profile values", () => {
    expect(sql).toContain(
      "update public.profiles set updated_at = updated_at",
    );
  });
});
