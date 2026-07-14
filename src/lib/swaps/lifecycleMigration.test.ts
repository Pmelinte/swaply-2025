import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationDirectory = join(process.cwd(), "supabase", "migrations");

function lifecycleMigrations() {
  return readdirSync(migrationDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => ({
      file,
      sql: readFileSync(join(migrationDirectory, file), "utf8"),
    }))
    .filter(({ sql }) =>
      sql.includes("Batch 61.1 canonical global Swap/Exchange"),
    );
}

describe("Batch 61.1 lifecycle migration contract", () => {
  it("keeps the Production-aligned lifecycle migration as the final contract", () => {
    const finalMigration = lifecycleMigrations().at(-1);

    expect(finalMigration).toBeDefined();
    expect(basename(finalMigration!.file)).toBe(
      "20260714192055_batch_61_1_canonical_swap_lifecycle.sql",
    );
  });

  it("pins the exact global status vocabulary", () => {
    const finalMigration = lifecycleMigrations().at(-1);
    expect(finalMigration).toBeDefined();

    const sql = finalMigration!.sql;
    for (const status of [
      "pending",
      "accepted",
      "in_progress",
      "completed",
      "rejected",
      "cancelled",
      "expired",
      "disputed",
    ]) {
      expect(sql).toContain(`'${status}'::text`);
    }

    expect(sql).not.toContain("delivered_by_a");
    expect(sql).not.toContain("delivered_by_b");
    expect(sql).not.toContain("'resolved'::text");
  });

  it("keeps the SQL transition graph aligned with TypeScript", () => {
    const finalMigration = lifecycleMigrations().at(-1);
    expect(finalMigration).toBeDefined();

    const normalized = finalMigration!.sql.replace(/\s+/g, " ");
    expect(normalized).toContain(
      "old.status = 'pending' and new.status not in ('accepted', 'rejected', 'cancelled', 'expired')",
    );
    expect(normalized).toContain(
      "old.status = 'accepted' and new.status not in ('in_progress', 'completed', 'cancelled', 'disputed')",
    );
    expect(normalized).toContain(
      "old.status = 'in_progress' and new.status not in ('completed', 'cancelled', 'disputed')",
    );
    expect(normalized).toContain(
      "old.status in ('completed', 'rejected', 'cancelled', 'expired', 'disputed')",
    );
  });

  it("validates the replacement constraint in the same migration", () => {
    const finalMigration = lifecycleMigrations().at(-1);
    expect(finalMigration).toBeDefined();

    const normalized = finalMigration!.sql.replace(/\s+/g, " ");
    expect(normalized).toContain(
      "add constraint swaps_status_check check",
    );
    expect(normalized).toContain(
      "validate constraint swaps_status_check",
    );
  });
});
