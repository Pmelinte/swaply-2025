import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function conflictMigration(): string {
  const file = readdirSync(migrationDirectory)
    .filter((name) =>
      name.endsWith("_batch_62_3_review_conflict_status.sql"),
    )
    .sort()
    .at(-1);

  expect(file).toBeDefined();
  return readFileSync(join(migrationDirectory, file!), "utf8").replace(
    /\s+/g,
    " ",
  );
}

describe("Batch 62.3 Review conflict HTTP contract", () => {
  it("maps a reused idempotency key with changed payload to SQLSTATE 23505", () => {
    const sql = conflictMigration();

    expect(sql).toContain("raise exception 'Idempotency key conflict' using errcode = '23505'");
    expect(sql).not.toContain("raise exception 'Idempotency key conflict' using errcode = '22023'");
  });

  it("preserves authenticated-only execution for canonical Review submission", () => {
    const sql = conflictMigration();

    expect(sql).toContain(
      "revoke execute on function public.submit_swap_review_v1( uuid, integer, text, text[], text[], text ) from public, anon, service_role",
    );
    expect(sql).toContain(
      "grant execute on function public.submit_swap_review_v1( uuid, integer, text, text[], text[], text ) to authenticated",
    );
  });
});
