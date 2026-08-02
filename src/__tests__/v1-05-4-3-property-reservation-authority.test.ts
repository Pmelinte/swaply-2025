import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const reservationMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260802170000_v1_05_4_3_property_reservation_authority.sql",
  ),
  "utf8",
);

describe("V1-05.4.3 Property reservation authority", () => {
  it("creates one server-authoritative reservation ledger with participant-only reads", () => {
    expect(reservationMigration).toContain(
      "create table if not exists public.property_reservations",
    );
    expect(reservationMigration).toContain(
      "alter table public.property_reservations enable row level security",
    );
    expect(reservationMigration).toContain(
      "drop policy if exists property_reservations_participant_select",
    );
    expect(reservationMigration).toContain(
      "create policy property_reservations_participant_select",
    );
    expect(reservationMigration).toContain(
      "auth.uid() in (s.requester_id, s.responder_id)",
    );
    expect(reservationMigration).toContain(
      "revoke all on table public.property_reservations",
    );
    expect(reservationMigration).toContain(
      "grant select on table public.property_reservations to authenticated",
    );
    expect(reservationMigration).not.toContain(
      "grant insert on table public.property_reservations to authenticated",
    );
    expect(reservationMigration).not.toContain(
      "grant update on table public.property_reservations to authenticated",
    );
  });

  it("uses a database exclusion constraint and a per-Property transaction lock", () => {
    expect(reservationMigration).toContain(
      "create extension if not exists btree_gist with schema extensions",
    );
    expect(reservationMigration).toContain(
      "add constraint property_reservations_no_active_overlap",
    );
    expect(reservationMigration).toContain("exclude using gist");
    expect(reservationMigration).toContain("property_item_id with =");
    expect(reservationMigration).toContain("stay_range with &&");
    expect(reservationMigration).toContain(
      "where (status in ('reserved', 'disputed', 'completed'))",
    );
    expect(reservationMigration).toContain(
      "pg_catalog.pg_advisory_xact_lock",
    );
    expect(reservationMigration).toContain(
      "'property-reservation:' || v_property_item_id::text",
    );
    expect(reservationMigration).toContain("when exclusion_violation then");
  });

  it("validates the complete canonical Property availability contract", () => {
    expect(reservationMigration).toContain(
      "private.property_period_is_available_v1",
    );
    expect(reservationMigration).toContain(
      "private.property_blocked_dates_overlap_v1",
    );
    expect(reservationMigration).toContain("v_property.available_from");
    expect(reservationMigration).toContain("v_property.available_until");
    expect(reservationMigration).toContain(
      "v_duration < greatest(1, coalesce(v_property.min_stay_days, 1))",
    );
    expect(reservationMigration).toContain(
      "v_duration > greatest(1, coalesce(v_property.max_stay_days, 365))",
    );
    expect(reservationMigration).toContain("v_property.advance_notice_days");
    expect(reservationMigration).toContain("v_property.available_months");
    expect(reservationMigration).toContain("v_property.blocked_dates");
    expect(reservationMigration).toContain(
      "r.status in ('reserved', 'disputed', 'completed')",
    );
  });

  it("creates booking locks atomically from the frozen bilateral Agreement", () => {
    expect(reservationMigration).toContain(
      "private.reserve_property_periods_on_exchange_v1",
    );
    expect(reservationMigration).toContain(
      "create trigger aaa_property_reservation_authority_v1",
    );
    expect(reservationMigration).toContain(
      "after insert on public.swaps",
    );
    expect(reservationMigration).toContain(
      "new.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'",
    );
    expect(reservationMigration).toContain(
      "new.exchange_data -> 'domain_terms'",
    );
    expect(reservationMigration).toContain(
      "Every Property in the Exchange requires one reservation period.",
    );
    expect(reservationMigration).toContain(
      "Duplicate Property reservation terms are not allowed.",
    );
    expect(reservationMigration).toContain(
      "Property period is unavailable or overlaps another reservation.",
    );
    expect(reservationMigration).toContain(
      "if new.exchange_kind <> 'bilateral' then",
    );
  });

  it("keeps availability and reservation reads participant-only", () => {
    expect(reservationMigration).toContain(
      "public.check_property_period_availability_v1",
    );
    expect(reservationMigration).toContain(
      "public.get_property_reservations_v1",
    );
    expect(reservationMigration).toContain(
      "Property availability access denied.",
    );
    expect(reservationMigration).toContain(
      "Property reservation access denied.",
    );
    expect(reservationMigration).toContain(
      "revoke all on function public.check_property_period_availability_v1",
    );
    expect(reservationMigration).toContain(
      "revoke all on function public.get_property_reservations_v1",
    );
    expect(reservationMigration).toContain("from public, anon");
    expect(reservationMigration).toContain("to authenticated");
  });

  it("releases on cancellation and preserves the lock through an active dispute", () => {
    expect(reservationMigration).toContain(
      "private.sync_property_reservations_from_swap_v1",
    );
    expect(reservationMigration).toContain(
      "new.status in ('cancelled', 'rejected', 'expired')",
    );
    expect(reservationMigration).toContain("release_reason = 'swap_' || new.status");
    expect(reservationMigration).toContain("elsif new.status = 'disputed' then");
    expect(reservationMigration).toContain("set status = 'disputed'");
    expect(reservationMigration).toContain("elsif new.status = 'completed' then");
    expect(reservationMigration).toContain("set status = 'completed'");
    expect(reservationMigration).not.toContain(
      "elsif new.status in ('accepted', 'in_progress') then",
    );
  });

  it("releases only after the dispute has a terminal moderation result", () => {
    expect(reservationMigration).toContain(
      "private.release_property_reservations_on_dispute_resolution_v1",
    );
    expect(reservationMigration).toContain(
      "new.status in ('resolved_requester', 'resolved_responder', 'resolved_split', 'rejected')",
    );
    expect(reservationMigration).toContain(
      "release_reason = 'dispute_' || new.status",
    );
    expect(reservationMigration).toContain(
      "create trigger release_property_reservations_on_dispute_resolution_v1",
    );
  });
});
