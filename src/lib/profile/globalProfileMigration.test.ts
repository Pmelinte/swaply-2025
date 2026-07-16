import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

const migrationNames = {
  contract: "20260716130000_batch_65_global_profile_contract.sql",
  revisionGuard: "20260716130100_batch_65_profile_revision_guard.sql",
  localeRegistry: "20260716130200_batch_65_locale_registry_completion.sql",
  corrective: "20260716130300_batch_65_1_profile_bootstrap_and_participant_projection.sql",
  updatePrivilege: "20260716130400_batch_65_1_remove_legacy_profile_update_privilege.sql",
} as const;

function batch65Files() {
  const files = readdirSync(migrationDirectory)
    .filter((name) => name.includes("_batch_65_") && name.endsWith(".sql"))
    .sort();

  expect(files).toEqual(Object.values(migrationNames));
  return files;
}

function readMigration(name: string) {
  return readFileSync(join(migrationDirectory, name), "utf8");
}

function combinedBatch65Sql() {
  return batch65Files().map(readMigration).join("\n");
}

function normalizeSql(sql: string) {
  return sql.replace(/\s+/g, " ").trim();
}

function functionBody(sql: string, signatureStart: string) {
  const signatureIndex = sql.indexOf(signatureStart);
  expect(signatureIndex).toBeGreaterThanOrEqual(0);

  const bodyStart = sql.indexOf("as $function$", signatureIndex);
  expect(bodyStart).toBeGreaterThan(signatureIndex);

  const bodyEnd = sql.indexOf("$function$;", bodyStart + "as $function$".length);
  expect(bodyEnd).toBeGreaterThan(bodyStart);

  return sql.slice(signatureIndex, bodyEnd + "$function$;".length);
}

describe("Batch 65 global-first profile migration contract", () => {
  it("uses an additive five-migration chain without destructive profile-table operations", () => {
    const sql = normalizeSql(combinedBatch65Sql());

    expect(sql).toContain("add column if not exists primary_language text");
    expect(sql).toContain("add column if not exists secondary_language text");
    expect(sql).toContain("add column if not exists tertiary_language text");
    expect(sql).toContain("add column if not exists auto_translate_messages boolean not null default true");
    expect(sql).toContain("add column if not exists show_original_language boolean not null default false");
    expect(sql).toContain("add column if not exists profile_revision bigint not null default 1");
    expect(sql).toContain("add column if not exists user_type text not null default 'individual'");
    expect(sql).toContain("add column if not exists availability_status text not null default 'available'");
    expect(sql).toContain("add column if not exists timezone text not null default 'UTC'");
    expect(sql).toContain("add column if not exists is_public boolean not null default true");
    expect(sql).toContain("add column if not exists expires_at timestamptz");
    expect(sql).not.toContain("drop table public.profiles");
    expect(sql).not.toContain("truncate public.profiles");
    expect(sql).not.toContain("delete from public.profiles");
  });

  it("keeps the database locale registry aligned with all 43 active application locales", () => {
    expect(locales).toHaveLength(43);
    expect(new Set(locales).size).toBe(43);

    const registrySql = normalizeSql(readMigration(migrationNames.localeRegistry));

    for (const locale of locales) {
      expect(registrySql).toContain(`'${locale}'`);
    }

    expect(registrySql).toContain("split_part(v_locale, '-', 1)");
    expect(registrySql).toContain("set search_path = pg_catalog, public");
  });

  it("backfills language preferences in the canonical order and keeps legacy columns compatible", () => {
    const sql = normalizeSql(readMigration(migrationNames.contract));

    expect(sql).toContain("array[r.primary_language, r.preferred_locale]");
    expect(sql).toContain("coalesce(r.languages, '{}'::text[])");
    expect(sql).toContain("array[r.auth_language, 'en']");
    expect(sql).toContain("preferred_locale = coalesce(v_primary, 'en')");
    expect(sql).toContain("languages = array_remove");
    expect(sql).toContain("profiles_languages_distinct");
    expect(sql).toContain("profiles_primary_language_valid");
    expect(sql).toContain("profiles_secondary_language_valid");
    expect(sql).toContain("profiles_tertiary_language_valid");
  });

  it("finalizes participant-aware privacy while minimizing public fields", () => {
    const sql = readMigration(migrationNames.corrective);
    const normalized = normalizeSql(sql);
    const sync = normalizeSql(
      functionBody(sql, "create or replace function public.sync_public_profile()"),
    );

    expect(normalized).toContain("add column if not exists is_public boolean not null default true");
    expect(normalized).toContain("create policy public_profiles_read");
    expect(normalized).toContain("is_public or public.profile_identity_allowed_v1(user_id)");
    expect(sync).toContain("v_is_public := coalesce((new.visibility ->> 'publicProfile')::boolean, true)");
    expect(sync).toContain("'{\"showBio\": true}'::jsonb");
    expect(sync).toContain("'{\"showInterests\": true}'::jsonb");
    expect(sync).toContain("'{\"showOccupation\": true}'::jsonb");
    expect(sync).toContain("'{\"showWebsite\": true}'::jsonb");
    expect(sync).toContain("'{\"showSocialLinks\": true}'::jsonb");
    expect(sync).toContain("new.address_city");
    expect(sync).toContain("new.address_country");
    expect(sync).not.toContain("new.email");
    expect(sync).not.toContain("new.date_of_birth");
    expect(sync).not.toContain("new.address_line1");
    expect(sync).not.toContain("new.address_lat");
    expect(sync).not.toContain("new.address_lon");
    expect(sync).not.toContain("new.stripe_customer_id");
    expect(sync).not.toContain("new.paypal_payer_id");
    expect(sync).not.toContain("new.token_balance");
    expect(sync).not.toContain("new.api_key_hash");
    expect(sync).not.toContain("new.swap_intent");
    expect(sync).not.toContain("new.user_type");
    expect(sync).not.toContain("new.availability_status");
  });

  it("defines one owner-only CAS authority and a bounded idempotency wrapper", () => {
    const contractSql = readMigration(migrationNames.contract);
    const updateCore = normalizeSql(
      functionBody(contractSql, "create or replace function public.update_own_profile_v1("),
    );
    const correctiveSql = readMigration(migrationNames.corrective);
    const updateWrapper = normalizeSql(
      functionBody(correctiveSql, "create or replace function public.update_own_profile_v1("),
    );

    expect(updateCore).toContain("v_actor_id uuid := auth.uid()");
    expect(updateCore).toContain("from public.profiles where user_id = v_actor_id for update");
    expect(updateCore).toContain("Stale profile revision: expected %, current %");
    expect(updateCore).toContain("profile_revision = v_profile.profile_revision + 1");
    expect(updateCore).toContain("insert into public.profile_update_requests");
    expect(updateCore).toContain("on conflict (actor_id, idempotency_key) do nothing");
    expect(updateCore).toContain("Profile idempotency key conflict");
    expect(updateCore).toContain("Unsupported profile fields");
    expect(updateCore).not.toContain("p_user_id");

    expect(normalizeSql(correctiveSql)).toContain(
      "rename to update_own_profile_core_v1",
    );
    expect(updateWrapper).toContain("delete from public.profile_update_requests");
    expect(updateWrapper).toContain("and expires_at < now()");
    expect(updateWrapper).toContain("public.update_own_profile_core_v1(");
    expect(updateWrapper).toContain("response = jsonb_build_object(");
    expect(updateWrapper).toContain("'profile_revision', coalesce(result_revision, v_original_revision)");
    expect(updateWrapper).toContain("'idempotent_result_revision'");
    expect(updateWrapper).toContain("'profile', to_jsonb(v_profile)");
  });

  it("provides deterministic bootstrap for missing and newly created Auth users", () => {
    const sql = readMigration(migrationNames.corrective);
    const normalized = normalizeSql(sql);
    const ensure = normalizeSql(
      functionBody(sql, "create or replace function public.ensure_own_profile_v1("),
    );
    const trigger = normalizeSql(
      functionBody(sql, "create or replace function public.bootstrap_profile_from_auth_user_v1()"),
    );

    expect(ensure).toContain("v_actor_id uuid := auth.uid()");
    expect(ensure).toContain("public.normalize_swaply_locale(p_route_locale)");
    expect(ensure).toContain("public.normalize_swaply_locale(v_auth_user.raw_user_meta_data ->> 'language')");
    expect(ensure).toContain("v_username := 'user_' || replace(v_actor_id::text, '-', '')");
    expect(ensure).toContain("on conflict (user_id) do nothing");
    expect(ensure).toContain("'created', v_inserted_id is not null");
    expect(trigger).toContain("on conflict (user_id) do nothing");
    expect(normalized).toContain("create trigger batch_65_profile_bootstrap_after_auth_insert");
    expect(normalized).toContain("from auth.users u where not exists");
    expect(normalized).toContain("grant execute on function public.ensure_own_profile_v1(text) to authenticated");
    expect(normalized).toContain("revoke execute on function public.ensure_own_profile_v1(text) from public, anon");
  });

  it("prevents browser callers from bypassing revision control", () => {
    const sql = normalizeSql(combinedBatch65Sql());

    expect(sql).toContain("drop policy if exists update_own_profile on public.profiles");
    expect(sql).toContain("revoke update on table public.profiles from authenticated");
    expect(sql).toContain("grant execute on function public.update_own_profile_v1(bigint, jsonb, text) to authenticated");
    expect(sql).toContain("alter table public.profile_update_requests enable row level security");
    expect(sql).toContain("revoke all on table public.profile_update_requests from public, anon, authenticated");
  });

  it("forces initial revision 1 and preserves server-controlled fields", () => {
    const guardSql = readMigration(migrationNames.revisionGuard);
    const guard = normalizeSql(
      functionBody(
        guardSql,
        "create or replace function public.protect_profile_privileged_fields()",
      ),
    );

    expect(guard).toContain("new.profile_revision := 1");
    expect(guard).toContain("new.profile_revision := old.profile_revision");
    expect(guard).toContain("new.role := old.role");
    expect(guard).toContain("new.trust_score := old.trust_score");
    expect(guard).toContain("new.token_balance := old.token_balance");
    expect(guard).toContain("new.api_key_hash := old.api_key_hash");
    expect(guardSql).toContain("set search_path = pg_catalog, public");
  });

  it("allows participant, moderator and admin identity without exposing private fields", () => {
    const contractSql = readMigration(migrationNames.contract);
    const identity = normalizeSql(
      functionBody(contractSql, "create or replace function public.get_profile_identity_v1("),
    );
    const correctiveSql = readMigration(migrationNames.corrective);
    const allowed = normalizeSql(
      functionBody(correctiveSql, "create or replace function public.profile_identity_allowed_v1("),
    );

    for (const body of [identity, allowed]) {
      expect(body).toContain("from public.user_roles r");
      expect(body).toContain("r.role in ('moderator', 'admin')");
      expect(body).toContain("from public.swaps s");
      expect(body).toContain("from public.conversations c");
      expect(body).toContain("c.participant_ids @> array[v_actor_id, p_target_user_id]::uuid[]");
      expect(body).toContain("from public.matches m");
    }

    expect(identity).toContain("'display_name', p.display_name");
    expect(identity).toContain("'languages', array_remove");
    expect(identity).not.toContain("p.email");
    expect(identity).not.toContain("p.date_of_birth");
    expect(identity).not.toContain("p.address_line1");
    expect(identity).not.toContain("p.address_lat");
    expect(identity).not.toContain("p.address_lon");
    expect(identity).not.toContain("p.stripe_customer_id");
    expect(identity).not.toContain("p.paypal_payer_id");
    expect(identity).not.toContain("p.token_balance");
    expect(identity).not.toContain("p.api_key_hash");
  });

  it("uses explicit search paths and narrow execution grants", () => {
    const sql = normalizeSql(combinedBatch65Sql());

    expect(sql).toContain("security definer set search_path = pg_catalog, public");
    expect(sql).toContain("security definer set search_path = pg_catalog, public, auth");
    expect(sql).toContain("revoke execute on function public.update_own_profile_core_v1(bigint, jsonb, text) from public, anon, authenticated");
    expect(sql).toContain("revoke execute on function public.update_own_profile_v1(bigint, jsonb, text) from public, anon");
    expect(sql).toContain("grant execute on function public.update_own_profile_v1(bigint, jsonb, text) to authenticated");
    expect(sql).toContain("revoke execute on function public.get_profile_identity_v1(uuid) from public, anon");
    expect(sql).toContain("grant execute on function public.get_profile_identity_v1(uuid) to authenticated");
  });
});
