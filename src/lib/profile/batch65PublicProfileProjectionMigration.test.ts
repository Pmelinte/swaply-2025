import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const projectionMigrationName =
  "20260718185820_batch_65_4_public_profile_projection.sql";
const hardeningMigrationName =
  "20260718194451_batch_65_4_private_profile_identity_predicate.sql";

const projectionMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", projectionMigrationName),
  "utf8",
);
const hardeningMigration = readFileSync(
  join(process.cwd(), "supabase", "migrations", hardeningMigrationName),
  "utf8",
);

const projectionSql = projectionMigration.replace(/\s+/g, " ").trim();
const hardeningSql = hardeningMigration.replace(/\s+/g, " ").trim();

const syncFunction = projectionSql.slice(
  projectionSql.indexOf(
    "create or replace function public.sync_public_profile()",
  ),
  projectionSql.indexOf(
    "revoke execute on function public.sync_public_profile()",
  ),
);

const privateIdentityFunction = hardeningSql.slice(
  hardeningSql.indexOf(
    "create or replace function private.profile_identity_allowed_v1(",
  ),
  hardeningSql.indexOf(
    "revoke all on function private.profile_identity_allowed_v1(uuid)",
  ),
);

describe("Batch 65.4 public profile projection migrations", () => {
  it("keeps the projection additive and leaves the compatibility write path intact", () => {
    expect(projectionSql).toContain(
      "add column if not exists is_public boolean not null default true",
    );
    expect(projectionSql).not.toContain("drop table public.public_profiles");
    expect(projectionSql).not.toContain("truncate public.public_profiles");
    expect(projectionSql).not.toContain(
      "revoke update on table public.profiles from authenticated",
    );
    expect(projectionSql).not.toContain(
      "drop policy if exists update_own_profile",
    );
    expect(hardeningSql).not.toContain(
      "revoke update on table public.profiles from authenticated",
    );
  });

  it("binds private identity access to the authenticated actor and real relationships", () => {
    expect(privateIdentityFunction).toContain(
      "v_actor_id uuid := auth.uid()",
    );
    expect(privateIdentityFunction).toContain(
      "v_actor_id = p_target_user_id",
    );
    expect(privateIdentityFunction).toContain(
      "r.role in ('moderator', 'admin')",
    );
    expect(privateIdentityFunction).toContain("from public.swaps s");
    expect(privateIdentityFunction).toContain(
      "from public.conversations c",
    );
    expect(privateIdentityFunction).toContain("from public.matches m");
    expect(privateIdentityFunction).not.toContain("p_actor_user_id");
  });

  it("keeps the relationship predicate outside the exposed public API schema", () => {
    expect(hardeningSql).toContain("create schema if not exists private");
    expect(hardeningSql).toContain(
      "create or replace function private.profile_identity_allowed_v1( p_target_user_id uuid )",
    );
    expect(hardeningSql).toContain(
      "revoke all on schema private from public, anon",
    );
    expect(hardeningSql).toContain(
      "grant usage on schema private to authenticated, service_role",
    );
    expect(hardeningSql).toContain(
      "revoke all on function private.profile_identity_allowed_v1(uuid) from public, anon",
    );
    expect(hardeningSql).toContain(
      "grant execute on function private.profile_identity_allowed_v1(uuid) to authenticated, service_role",
    );
    expect(hardeningSql).toContain(
      "drop function public.profile_identity_allowed_v1(uuid)",
    );
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

  it("separates anonymous public discovery from authenticated participant identity", () => {
    expect(hardeningSql).toContain(
      "create policy public_profiles_public_read on public.public_profiles for select to anon, authenticated using (is_public)",
    );
    expect(hardeningSql).toContain(
      "create policy public_profiles_participant_read on public.public_profiles for select to authenticated using (private.profile_identity_allowed_v1(user_id))",
    );
    expect(projectionSql).toContain(
      "grant select on table public.public_profiles to anon, authenticated",
    );
    expect(projectionSql).toContain(
      "revoke execute on function public.sync_public_profile() from public, anon, authenticated",
    );
  });

  it("rebuilds the projection without changing profile values", () => {
    expect(projectionSql).toContain(
      "update public.profiles set updated_at = updated_at",
    );
  });
});
