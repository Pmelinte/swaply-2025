import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function exchangeHandoffMigrations() {
  return readdirSync(migrationDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(join(migrationDirectory, file), "utf8"),
    }))
    .filter(({ sql }) =>
      sql.includes("create_exchange_from_match_agreement"),
    );
}

describe("Batch 60.2 Exchange handoff migration contract", () => {
  it("keeps the forward-only drift repair as the final RPC definition", () => {
    const migrations = exchangeHandoffMigrations();
    const finalMigration = migrations.at(-1);

    expect(finalMigration).toBeDefined();
    expect(basename(finalMigration!.file)).toBe(
      "20260714071130_batch_60_restore_hardened_exchange_handoff.sql",
    );
  });

  it("preserves the reviewed bilateral guard and response implementation", () => {
    const finalMigration = exchangeHandoffMigrations().at(-1);
    expect(finalMigration).toBeDefined();

    const sql = finalMigration!.sql;
    expect(sql).toContain(
      "return public.create_exchange_from_match_agreement_v1(",
    );
    expect(sql).toContain("v_completed ? 'agreement'");
    expect(sql).toContain(
      "revoke all on function public.create_exchange_from_match_agreement_v1(uuid, integer)",
    );
    expect(sql).toContain("from authenticated;");
  });

  it("keeps one canonical idempotency index", () => {
    const finalMigration = exchangeHandoffMigrations().at(-1);
    expect(finalMigration).toBeDefined();

    const sql = finalMigration!.sql;
    expect(sql).toContain(
      "drop index if exists public.swaps_conversation_id_key;",
    );
    expect(sql).toContain(
      "create unique index if not exists swaps_conversation_id_unique",
    );
  });
});
