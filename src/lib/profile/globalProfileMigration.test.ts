import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function batch65Files() {
  const files = readdirSync(migrationDirectory)
    .filter((name) => name.includes("_batch_65_") && name.endsWith(".sql"))
    .sort();

  expect(files).toEqual([
    "20260716130000_batch_65_global_profile_contract.sql",
    "20260716130100_batch_65_profile_revision_guard.sql",
    "20260716130200_batch_65_locale_registry_completion.sql",
  ]);

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
  it("uses an additive migration chain without destructive profile-table operations", () => {
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
    expect(sql).not.toContain("drop table public.profiles");
    expect(sql).not.toContain("truncate public.profiles");
    expect(sql).not.toContain("delete from public.profiles");
  });

  it("keeps the database locale registry aligned with all 43 active application locales", () => {
    expect(locales).toHaveLength(43);
    expect(new Set(locales).size).toBe(43);

    const registrySql = normalizeSql(
      readMigration("20260716130200_batch_65_locale_registry_completion.sql"),
    );

    for (const locale of locales) {
      expect(registrySql).toContain(`'${locale}'`);
    }

    expect(registrySql).toContain("split_part(v_locale, '-', 1)");
    expect(registrySql).toContain("set search_path = pg_catalog, public");
  });

  it("backfills language preferences in the canonical order and keeps legacy columns compatible", () => {
    const sql = normalizeSql(
      readMigration("20260716130000_batch_65_global_profile_contract.sql"),
    );

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

  it("removes private profiles from public discovery and requires opt-in for social fields", () => {
    const sql = readMigration("20260716130000_batch_65_global_profile_contract.sql");
    const sync = normalizeSql(
      functionBody(sql, "create or replace function public.sync_public_profile()"),
    );

    expect(sync).toContain("new.visibility ->> 'publicProfile'");
    expect(sync).toContain("delete from public.public_profiles where user_id = new.user_id");
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
  });

  it("defines one owner-only CAS and idempotency authority for profile updates", () => {
    const sql = readMigration("20260716130000_batch_65_global_profile_contract.sql");
    const updateAuthority = normalizeSql(
      functionBody(
        sql,
        "create or replace function public.update_own_profile_v1(",
      ),
    );

    expect(updateAuthority).toContain("v_actor_id uuid := auth.uid()");
    expect(updateAuthority).toContain("from public.profiles where user_id = v_actor_id for update");
    expect(updateAuthority).toContain("Stale profile revision: expected %, current %");
    expect(updateAuthority).toContain("profile_revision = v_profile.profile_revision + 1");
    expect(updateAuthority).toContain("insert into public.profile_update_requests");
    expect(updateAuthority).toContain("on conflict (actor_id, idempotency_key) do nothing");
    expect(updateAuthority).toContain("Profile idempotency key conflict");
    expect(updateAuthority).toContain("jsonb_set(v_existing_request.response, '{replayed}', 'true'::jsonb, true)");
    expect(updateAuthority).toContain("Unsupported profile fields");
    expect(updateAuthority).not.toContain("p_user_id");
    expect(updateAuthority).not.toContain("role =");
    expect(updateAuthority).not.toContain("trust_score =");
    expect(updateAuthority).not.toContain("token_balance =");
  });

  it("prevents browser callers from bypassing revision control", () => {
    const sql = normalizeSql(
      readMigration("20260716130000_batch_65_global_profile_contract.sql"),
    );

    expect(sql).toContain("drop policy if exists update_own_profile on public.profiles");
    expect(sql).toContain("revoke update on table public.profiles from authenticated");
    expect(sql).toContain("grant execute on function public.update_own_profile_v1(bigint, jsonb, text) to authenticated");
    expect(sql).toContain("alter table public.profile_update_requests enable row level security");
    expect(sql).toContain("revoke all on table public.profile_update_requests from public, anon, authenticated");
  });

  it("forces initial revision 1 and preserves server-controlled fields", () => {
    const guardSql = readMigration(
      "20260716130100_batch_65_profile_revision_guard.sql",
    );
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

  it("provides only minimal identity to an existing participant, moderator or admin", () => {
    const sql = readMigration("20260716130000_batch_65_global_profile_contract.sql");
    const identity = normalizeSql(
      functionBody(
        sql,
        "create or replace function public.get_profile_identity_v1(",
      ),
    );

    expect(identity).toContain("from public.user_roles r");
    expect(identity).toContain("r.role in ('moderator', 'admin')");
    expect(identity).toContain("from public.swaps s");
    expect(identity).toContain("from public.conversations c");
    expect(identity).toContain("c.participant_ids @> array[v_actor_id, p_target_user_id]::uuid[]");
    expect(identity).toContain("from public.matches m");
    expect(identity).toContain("Profile identity access denied");
    expect(identity).toContain("'display_name', p.display_name");
    expect(identity).toContain("'languages', array_remove");
    expect(identity).toContain("'availability_status', p.availability_status");
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

  it("uses explicit search paths and narrow execution grants for exposed RPCs", () => {
    const sql = normalizeSql(combinedBatch65Sql());

    expect(sql).toContain("security definer set search_path = pg_catalog, public");
    expect(sql).toContain("revoke execute on function public.update_own_profile_v1(bigint, jsonb, text) from public, anon");
    expect(sql).toContain("grant execute on function public.update_own_profile_v1(bigint, jsonb, text) to authenticated");
    expect(sql).toContain("revoke execute on function public.get_profile_identity_v1(uuid) from public, anon");
    expect(sql).toContain("grant execute on function public.get_profile_identity_v1(uuid) to authenticated");
  });
});
