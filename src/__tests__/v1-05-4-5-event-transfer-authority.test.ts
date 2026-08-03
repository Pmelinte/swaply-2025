import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const transferMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260803001000_v1_05_4_5_event_transfer_authority.sql",
  ),
  "utf8",
);

describe("V1-05.4.5 Event transfer authority", () => {
  it("creates a server-authoritative transfer ledger and private proof store", () => {
    expect(transferMigration).toContain(
      "create table if not exists public.event_transfers",
    );
    expect(transferMigration).toContain(
      "create table if not exists public.event_proofs",
    );
    expect(transferMigration).toContain(
      "create table if not exists public.event_transfer_events",
    );
    expect(transferMigration).toContain(
      "create table if not exists public.event_transfer_mutation_receipts",
    );
    expect(transferMigration).toContain(
      "unique (swap_id, event_item_id)",
    );
    expect(transferMigration).toContain(
      "unique (transfer_id, proof_revision)",
    );
    expect(transferMigration).toContain(
      "payload_digest text not null check (payload_digest ~ '^[a-f0-9]{64}$')",
    );
  });

  it("keeps participant projections readable while raw proof and receipts remain private", () => {
    expect(transferMigration).toContain(
      "alter table public.event_transfers enable row level security",
    );
    expect(transferMigration).toContain(
      "alter table public.event_proofs enable row level security",
    );
    expect(transferMigration).toContain(
      "alter table public.event_transfer_events enable row level security",
    );
    expect(transferMigration).toContain(
      "alter table public.event_transfer_mutation_receipts enable row level security",
    );
    expect(transferMigration).toContain(
      "create policy event_transfers_participant_select",
    );
    expect(transferMigration).toContain(
      "using ((select auth.uid()) in (provider_id, recipient_id))",
    );
    expect(transferMigration).toContain(
      "create policy event_transfer_events_participant_select",
    );
    expect(transferMigration).toContain(
      "grant select on table public.event_transfers to authenticated",
    );
    expect(transferMigration).toContain(
      "grant select on table public.event_transfer_events to authenticated",
    );
    expect(transferMigration).not.toContain(
      "grant select on table public.event_proofs to authenticated",
    );
    expect(transferMigration).not.toContain(
      "grant select on table public.event_transfer_mutation_receipts to authenticated",
    );
  });

  it("creates transfer holds atomically from the frozen bilateral Agreement", () => {
    expect(transferMigration).toContain(
      "private.create_event_transfers_on_exchange_v1",
    );
    expect(transferMigration).toContain(
      "create trigger aaa_create_event_transfers_v1",
    );
    expect(transferMigration).toContain("after insert on public.swaps");
    expect(transferMigration).toContain(
      "new.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'",
    );
    expect(transferMigration).toContain(
      "new.exchange_data -> 'domain_terms'",
    );
    expect(transferMigration).toContain(
      "Every Event in the Exchange requires one transfer contract.",
    );
    expect(transferMigration).toContain(
      "Duplicate Event transfer terms are not allowed.",
    );
    expect(transferMigration).toContain(
      "Event listing is unavailable or its issuer transfer contract changed.",
    );
  });

  it("protects quantity with an Event-scoped transaction lock and current capacity", () => {
    expect(transferMigration).toContain(
      "pg_catalog.pg_advisory_xact_lock",
    );
    expect(transferMigration).toContain(
      "'event-transfer-capacity:' || v_source.event_item_id::text",
    );
    expect(transferMigration).toContain(
      "coalesce(v_event.capacity_available, v_event.capacity_total, 0)",
    );
    expect(transferMigration).toContain(
      "Event transfer capacity is unavailable.",
    );
    expect(transferMigration).toContain(
      "set capacity_available = v_available - v_quantity",
    );
    expect(transferMigration).toContain(
      "private.release_event_transfer_capacity_v1",
    );
    expect(transferMigration).toContain(
      "v_transfer.confirmed_at is not null",
    );
  });

  it("validates issuer authority, deadline, bundle and proof requirements again at handoff", () => {
    expect(transferMigration).toContain(
      "coalesce(v_event.is_transferable, false) is not true",
    );
    expect(transferMigration).toContain(
      "coalesce(v_event.transfer_rule_confirmed, false) is not true",
    );
    expect(transferMigration).toContain(
      "btrim(v_terms ->> 'issuer_rule_source') <> btrim(v_event.transfer_rule_source)",
    );
    expect(transferMigration).toContain(
      "v_deadline > v_event.transfer_deadline_at",
    );
    expect(transferMigration).toContain(
      "coalesce(v_event.includes_accommodation, false) is not true",
    );
    expect(transferMigration).toContain(
      "coalesce(v_event.includes_transport, false) is not true",
    );
    expect(transferMigration).toContain(
      "(v_terms ->> 'proof_required')::boolean is not true",
    );
  });

  it("exposes raw proof only through a participant-authorized revisioned RPC", () => {
    expect(transferMigration).toContain(
      "public.get_event_transfer_proof_v1",
    );
    expect(transferMigration).toContain("Event proof access denied.");
    expect(transferMigration).toContain(
      "Event proof revision is unavailable or stale.",
    );
    expect(transferMigration).toContain(
      "'proof', v_proof.payload",
    );
    expect(transferMigration).toContain(
      "private.event_transfer_response_v1",
    );
    expect(transferMigration).toContain(
      "'proof_summary', v_proof_summary",
    );
    expect(transferMigration).not.toContain(
      "'proof', proof_row.payload",
    );
    expect(transferMigration).toContain(
      "revoke all on function public.get_event_transfer_proof_v1",
    );
    expect(transferMigration).toContain("from public, anon");
    expect(transferMigration).toContain("to authenticated");
  });

  it("supports private proof versions without leaking raw codes into the Event ledger", () => {
    expect(transferMigration).toContain(
      "private.validate_event_transfer_proof_v1",
    );
    expect(transferMigration).toContain(
      "'ticket', 'booking_reference', 'qr_code', 'transfer_confirmation'",
    );
    expect(transferMigration).toContain(
      "extensions.digest(v_proof::text, 'sha256')",
    );
    expect(transferMigration).toContain(
      "'proof_count', jsonb_array_length(v_proof)",
    );
    expect(transferMigration).toContain(
      "'payload_digest', v_proof_digest",
    );
    expect(transferMigration).not.toContain(
      "jsonb_build_object('proof', v_proof)",
    );
  });

  it("enforces provider and recipient authority, optimistic revision and exact replay", () => {
    expect(transferMigration).toContain(
      "public.mutate_event_transfer_v1",
    );
    expect(transferMigration).toContain(
      "'event-transfer-receipt:' || v_actor::text",
    );
    expect(transferMigration).toContain(
      "Idempotency key already used with another Event transfer request.",
    );
    expect(transferMigration).toContain(
      "Stale Event transfer revision: expected %s, current %s.",
    );
    expect(transferMigration).toContain(
      "Only the Event provider may submit transfer proof.",
    );
    expect(transferMigration).toContain(
      "Only the Event recipient may request another transfer proof.",
    );
    expect(transferMigration).toContain(
      "Only the Event recipient may confirm transfer.",
    );
    expect(transferMigration).toContain(
      "Only the Event recipient may report transfer failure.",
    );
    expect(transferMigration).toContain(
      "return v_receipt.response || jsonb_build_object('replayed', true)",
    );
  });

  it("advances an accepted Exchange when the provider submits the first proof", () => {
    expect(transferMigration).toContain(
      "if v_swap.status = 'accepted' then",
    );
    expect(transferMigration).toContain(
      "perform public.apply_swap_transition_v1(",
    );
    expect(transferMigration).toContain(
      "'accepted',\n        'in_progress',\n        v_actor,\n        'event_transfer'",
    );
    expect(transferMigration).toContain(
      "p_idempotency_key || ':swap'",
    );
  });

  it("blocks Exchange completion until every Event transfer is confirmed", () => {
    expect(transferMigration).toContain(
      "private.event_transfer_completion_guard_v1",
    );
    expect(transferMigration).toContain(
      "create trigger aaa_event_transfer_completion_guard_v1",
    );
    expect(transferMigration).toContain(
      "before update of status on public.swaps",
    );
    expect(transferMigration).toContain(
      "transfer_row.status <> 'confirmed'",
    );
    expect(transferMigration).toContain(
      "Every Event transfer must be confirmed before Exchange completion.",
    );
  });

  it("routes issuer rejection, invalid proof and deadline failure to canonical dispute authority", () => {
    expect(transferMigration).toContain(
      "'not_received', 'issuer_rejected', 'expired', 'invalid_proof'",
    );
    expect(transferMigration).toContain(
      "'fraud_suspected', 'other'",
    );
    expect(transferMigration).toContain(
      "Event transfer failure details are invalid or premature.",
    );
    expect(transferMigration).toContain(
      "public.open_swap_dispute_v1",
    );
    expect(transferMigration).toContain(
      "concat('Event transfer failure [', v_reason, ']: ', v_description)",
    );
    expect(transferMigration).toContain(
      "'event:' || p_idempotency_key",
    );
  });

  it("releases only unconfirmed capacity on cancellation or terminal dispute resolution", () => {
    expect(transferMigration).toContain(
      "private.sync_event_transfers_from_swap_v1",
    );
    expect(transferMigration).toContain(
      "new.status in ('cancelled', 'rejected', 'expired')",
    );
    expect(transferMigration).toContain("close_reason = 'swap_' || new.status");
    expect(transferMigration).toContain("elsif new.status = 'disputed' then");
    expect(transferMigration).toContain(
      "private.resolve_event_transfers_from_dispute_v1",
    );
    expect(transferMigration).toContain(
      "new.status in (\n      'resolved_requester', 'resolved_responder', 'resolved_split', 'rejected'",
    );
    expect(transferMigration).toContain(
      "or v_transfer.confirmed_at is not null",
    );
    expect(transferMigration).toContain("'capacity_released'");
  });
});
