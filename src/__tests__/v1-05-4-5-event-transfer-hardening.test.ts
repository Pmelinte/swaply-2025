import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const hardeningMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260803030000_v1_05_4_5_event_transfer_hardening.sql",
  ),
  "utf8",
);

describe("V1-05.4.5 Event transfer hardening", () => {
  it("uses one idempotent authority for new and pre-existing Event Exchanges", () => {
    expect(hardeningMigration).toContain(
      "private.ensure_event_transfers_for_swap_v1",
    );
    expect(hardeningMigration).toContain(
      "perform private.ensure_event_transfers_for_swap_v1(new.id, auth.uid())",
    );
    expect(hardeningMigration).toContain(
      "private.backfill_event_transfers_v1",
    );
    expect(hardeningMigration).toContain(
      "select private.backfill_event_transfers_v1()",
    );
    expect(hardeningMigration).toContain(
      "swap_row.status in ('pending', 'accepted', 'in_progress', 'disputed')",
    );
  });

  it("fails closed when completed Event Exchanges lack confirmed transfer history", () => {
    expect(hardeningMigration).toContain(
      "A completed Event Exchange lacks confirmed transfer history",
    );
    expect(hardeningMigration).toContain(
      "v_actual_count <> v_expected_count",
    );
    expect(hardeningMigration).toContain(
      "transfer_row.status <> 'confirmed'",
    );
    expect(hardeningMigration).toContain(
      "Every Event Exchange must have one confirmed transfer per Event before completion.",
    );
  });

  it("coordinates listing edits with Event transfer capacity holds", () => {
    expect(hardeningMigration).toContain(
      "private.enforce_event_capacity_holds_v1",
    );
    expect(hardeningMigration).toContain(
      "pg_catalog.pg_try_advisory_xact_lock",
    );
    expect(hardeningMigration).toContain(
      "transfer_row.capacity_released_at is null",
    );
    expect(hardeningMigration).toContain(
      "Event capacity update would overwrite reserved Event transfer capacity.",
    );
    expect(hardeningMigration).toContain(
      "before update of capacity_total, capacity_available on public.events_listings",
    );
  });

  it("releases capacity before the guarded listing increment and uses explicit deadline arithmetic", () => {
    const releaseMarker = hardeningMigration.indexOf(
      "set capacity_released_at = clock_timestamp()",
    );
    const listingIncrementMarker = hardeningMigration.indexOf(
      "set capacity_available = v_next_capacity",
    );

    expect(releaseMarker).toBeGreaterThan(-1);
    expect(listingIncrementMarker).toBeGreaterThan(releaseMarker);
    expect(hardeningMigration).toContain(
      "interval '23 hours 59 minutes 59 seconds'",
    );
  });
});
