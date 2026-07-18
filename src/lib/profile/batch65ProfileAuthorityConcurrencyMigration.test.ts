import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase",
    "migrations",
    "20260718180050_batch_65_3_profile_authority_concurrency_hardening.sql",
  ),
  "utf8",
).replace(/\s+/g, " ").trim();

describe("Batch 65.3 profile update concurrency hardening", () => {
  it("serializes duplicate actor/key requests before reading the marker", () => {
    const lockIndex = migration.indexOf("pg_advisory_xact_lock");
    const markerIndex = migration.indexOf(
      "from public.profile_update_idempotency where user_id = v_user_id",
    );

    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(markerIndex).toBeGreaterThan(lockIndex);
    expect(migration).toContain(
      "hashtextextended(v_user_id::text || ':' || p_idempotency_key, 0)",
    );
    expect(migration).toContain("'replayed', true");
    expect(migration).toContain("'idempotent_result_revision'");
  });

  it("keeps different-key races behind the profile compare-and-set lock", () => {
    expect(migration).toContain("where user_id = v_user_id for update");
    expect(migration).toContain("v_current.profile_revision <> p_expected_revision");
    expect(migration).toContain("profile_revision = profile_revision + 1");
    expect(migration).toContain("errcode = '40001'");
  });

  it("validates booleans, enums, identity and JSON object fields", () => {
    expect(migration).toContain(
      "jsonb_typeof(p_payload -> 'auto_translate_messages') <> 'boolean'",
    );
    expect(migration).toContain(
      "jsonb_typeof(p_payload -> 'show_original_language') <> 'boolean'",
    );
    expect(migration).toContain("Username cannot be empty");
    expect(migration).toContain("Unsupported user_type");
    expect(migration).toContain("Unsupported availability_status");
    expect(migration).toContain("Profile JSON fields must be objects");
  });

  it("retains narrow grants and an explicit definer search path", () => {
    expect(migration).toContain(
      "security definer set search_path = pg_catalog, public, auth",
    );
    expect(migration).toContain(
      "revoke execute on function public.update_own_profile_v1(bigint, jsonb, text) from public, anon",
    );
    expect(migration).toContain(
      "grant execute on function public.update_own_profile_v1(bigint, jsonb, text) to authenticated, service_role",
    );
  });
});
