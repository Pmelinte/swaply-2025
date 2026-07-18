import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/config";

const migrationName =
  "20260718180005_batch_65_3_profile_authority_activation.sql";
const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", migrationName),
  "utf8",
);
const sql = migration.replace(/\s+/g, " ").trim();

describe("Batch 65.3 profile authority migration", () => {
  it("keeps the change additive and preserves the compatibility bridge", () => {
    expect(sql).toContain("add column if not exists primary_language text");
    expect(sql).toContain("add column if not exists secondary_language text");
    expect(sql).toContain("add column if not exists tertiary_language text");
    expect(sql).toContain(
      "add column if not exists auto_translate_messages boolean not null default true",
    );
    expect(sql).toContain(
      "add column if not exists show_original_language boolean not null default false",
    );
    expect(sql).toContain(
      "add column if not exists profile_revision bigint not null default 1",
    );
    expect(sql).not.toContain("drop table public.profiles");
    expect(sql).not.toContain("truncate public.profiles");
    expect(sql).not.toContain("revoke update on table public.profiles from authenticated");
    expect(sql).not.toContain("drop policy if exists update_own_profile");
  });

  it("aligns database locale normalization with all active application locales", () => {
    expect(locales).toHaveLength(43);
    expect(new Set(locales).size).toBe(43);

    for (const locale of locales) {
      expect(sql).toContain(`'${locale}'`);
    }

    expect(sql).toContain("split_part(v_locale, '-', 1)");
  });

  it("defines owner-only bootstrap and compare-and-set update RPCs", () => {
    expect(sql).toContain(
      "create or replace function public.ensure_own_profile_v1(p_route_locale text default null)",
    );
    expect(sql).toContain(
      "create or replace function public.update_own_profile_v1(p_expected_revision bigint, p_payload jsonb, p_idempotency_key text)",
    );
    expect(sql).toContain("v_user_id uuid := auth.uid()");
    expect(sql).toContain("where user_id=v_user_id for update");
    expect(sql).toContain("Stale profile revision");
    expect(sql).toContain("profile_revision=profile_revision+1");
    expect(sql).toContain("Unsupported profile field");
    expect(sql).not.toContain("p_user_id");
  });

  it("bounds idempotency and protects revision from direct compatibility writes", () => {
    expect(sql).toContain("create table if not exists public.profile_update_idempotency");
    expect(sql).toContain("primary key (user_id, idempotency_key)");
    expect(sql).toContain("created_at < now()-interval '24 hours'");
    expect(sql).toContain("new.profile_revision := 1");
    expect(sql).toContain("new.profile_revision := old.profile_revision");
    expect(sql).toContain(
      "revoke all on table public.profile_update_idempotency from public, anon, authenticated",
    );
  });

  it("repairs missing profiles and installs deterministic Auth bootstrap", () => {
    expect(sql).toContain(
      "create or replace function public.bootstrap_swaply_profile_from_auth()",
    );
    expect(sql).toContain("create trigger on_auth_user_created_profile");
    expect(sql).toContain("'user_'||replace(new.id::text,'-','')");
    expect(sql).toContain("left join public.profiles p on p.user_id=u.id");
    expect(sql).toContain("where p.user_id is null");
    expect(sql).toContain("on conflict(user_id) do nothing");
  });

  it("uses explicit search paths and narrow grants", () => {
    expect(sql).toContain("security definer set search_path = pg_catalog, public, auth");
    expect(sql).toContain(
      "revoke execute on function public.ensure_own_profile_v1(text) from public, anon",
    );
    expect(sql).toContain(
      "grant execute on function public.ensure_own_profile_v1(text) to authenticated, service_role",
    );
    expect(sql).toContain(
      "revoke execute on function public.update_own_profile_v1(bigint,jsonb,text) from public, anon",
    );
    expect(sql).toContain(
      "grant execute on function public.update_own_profile_v1(bigint,jsonb,text) to authenticated, service_role",
    );
  });
});
