import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

const workflow = read(".github/workflows/v1-10-1-recovery-drill.yml");
const inventory = read("scripts/v1-10/production-inventory.mjs");
const fixture = read("supabase/tests/fixtures/v1_10_recovery_source.sql");
const verification = read("supabase/tests/v1_10_recovery_restore_verify.sql");
const evidence = read("docs/V1-10.1_RECOVERY_DRILL.md");

describe("V1-10.1 recovery contract", () => {
  it("executes a real logical backup and clean isolated restore", () => {
    expect(workflow).toContain("postgres:17");
    expect(workflow).toContain("pg_dump");
    expect(workflow).toContain("--format custom");
    expect(workflow).toContain("pg_restore");
    expect(workflow).toContain("--exit-on-error");
    expect(workflow).toContain("swaply_recovery_source");
    expect(workflow).toContain("swaply_recovery_target");
    expect(workflow).toContain("sha256sum");
    expect(workflow).toContain("retention-days: 90");
  });

  it("keeps the Production inventory read-only and excludes raw content", () => {
    expect(workflow).toContain("Read-only Production recovery inventory");
    expect(workflow).toContain("secrets.SUPABASE_SERVICE_ROLE_KEY");
    expect(inventory).toContain('mode: "READ_ONLY_COUNTS_ONLY"');
    expect(inventory).toContain('.select("*", { count: "exact", head: true })');
    expect(inventory).toContain("auth.admin.listUsers");
    expect(inventory).toContain("storage.listBuckets");

    const compactInventory = inventory.replace(/\s+/g, " ");
    expect(compactInventory).not.toMatch(
      /\.from\([^)]*\)\s*\.(insert|update|upsert|delete)\s*\(/,
    );
    expect(compactInventory).not.toMatch(/supabase\s*\.\s*rpc\s*\(/);
    expect(inventory).not.toContain("user.email");
    expect(inventory).not.toContain("object.name");
  });

  it("covers representative private, public, media and ledger resources", () => {
    for (const resource of [
      "auth.users",
      "storage.objects",
      "public.profiles",
      "public.items",
      "public.swaps",
      "public.messages",
      "public.stories",
      "public.story_consents",
      "public.swapleni_ledger",
      "public.blog_posts",
    ]) {
      expect(fixture).toContain(resource);
    }
    expect(fixture).toContain("enable row level security");
    expect(fixture).toContain("example.invalid");
  });

  it("verifies counts, relationships, RLS, policies and checksums after restore", () => {
    expect(verification).toContain("auth_users_restored");
    expect(verification).toContain("item_owner_integrity");
    expect(verification).toContain("message_conversation_integrity");
    expect(verification).toContain("story_consent_integrity");
    expect(verification).toContain("rls_restored");
    expect(verification).toContain("policies_restored");
    expect(verification).toContain("profile_checksum_restored");
    expect(verification).toContain("ledger_balance_restored");
  });

  it("locks honest recovery boundaries instead of inventing managed backups", () => {
    expect(evidence).toContain("Supabase organization is currently on the Free plan");
    expect(evidence).toContain("exports no rows");
    expect(evidence).toContain("does not recover the actual bytes");
    expect(evidence).toContain("does not preserve password hashes");
    expect(evidence).toContain("V1-10 is closed");
    expect(evidence).toContain("does not authorize `v1.0.0`");
  });

  it("proves rollback and forward-fix mechanics without touching Production", () => {
    expect(workflow).toContain("Verify transactional rollback");
    expect(workflow).toContain("rollback-sentinel");
    expect(workflow).toContain("Verify forward-fix migration strategy");
    expect(workflow).toContain("v1-10-forward-fix");
    expect(evidence).toContain("no Supabase Production migration or data write occurs");
  });
});
