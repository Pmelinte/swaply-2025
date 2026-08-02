import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const serviceDeliveryMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260802190000_v1_05_4_4_service_delivery_authority.sql",
  ),
  "utf8",
);

const publicLedgers = [
  "service_deliveries",
  "service_delivery_milestones",
  "service_delivery_events",
] as const;

const allLedgers = [
  ...publicLedgers,
  "service_delivery_mutation_receipts",
] as const;

describe("V1-05.4.4 Service delivery authority", () => {
  it("creates four server-authoritative ledgers with participant-only reads", () => {
    for (const table of allLedgers) {
      expect(serviceDeliveryMigration).toContain(
        `create table if not exists public.${table}`,
      );
      expect(serviceDeliveryMigration).toContain(
        `alter table public.${table} enable row level security`,
      );
      expect(serviceDeliveryMigration).toContain(
        `revoke all on table public.${table}`,
      );
    }

    for (const table of publicLedgers) {
      expect(serviceDeliveryMigration).toContain(
        `grant select on table public.${table} to authenticated`,
      );
    }

    expect(serviceDeliveryMigration).not.toContain(
      "grant select on table public.service_delivery_mutation_receipts to authenticated",
    );
    expect(serviceDeliveryMigration).toContain(
      "create policy service_deliveries_participant_select",
    );
    expect(serviceDeliveryMigration).toContain(
      "auth.uid() in (provider_id, recipient_id)",
    );
    expect(serviceDeliveryMigration).toContain(
      "create policy service_delivery_milestones_participant_select",
    );
    expect(serviceDeliveryMigration).toContain(
      "auth.uid() in (d.provider_id, d.recipient_id)",
    );
    expect(serviceDeliveryMigration).toContain(
      "create policy service_delivery_events_participant_select",
    );
  });

  it("denies direct authenticated mutations and keeps receipts private", () => {
    for (const table of allLedgers) {
      expect(serviceDeliveryMigration).not.toContain(
        `grant insert on table public.${table} to authenticated`,
      );
      expect(serviceDeliveryMigration).not.toContain(
        `grant update on table public.${table} to authenticated`,
      );
      expect(serviceDeliveryMigration).not.toContain(
        `grant delete on table public.${table} to authenticated`,
      );
      expect(serviceDeliveryMigration).not.toContain(
        `grant all on table public.${table} to authenticated`,
      );
    }

    expect(serviceDeliveryMigration).toContain(
      "primary key (actor_id, delivery_id, idempotency_key)",
    );
    expect(serviceDeliveryMigration).toContain(
      "check (request_hash ~ '^[a-f0-9]{64}$')",
    );
    expect(serviceDeliveryMigration).toContain(
      "check (jsonb_typeof(response) = 'object')",
    );
  });

  it("freezes complete Service Agreement terms into atomic delivery records", () => {
    expect(serviceDeliveryMigration).toContain(
      "private.create_service_deliveries_on_exchange_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "create trigger aaa_create_service_deliveries_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "after insert on public.swaps",
    );
    expect(serviceDeliveryMigration).toContain(
      "new.swap_metadata ->> 'source' is distinct from 'domain_aware_match_agreement'",
    );
    expect(serviceDeliveryMigration).toContain(
      "new.exchange_data -> 'domain_terms'",
    );
    expect(serviceDeliveryMigration).toContain(
      "Every Service in the Exchange requires one delivery contract.",
    );
    expect(serviceDeliveryMigration).toContain(
      "Duplicate Service delivery terms are not allowed.",
    );
    expect(serviceDeliveryMigration).toContain(
      "unique (swap_id, service_item_id)",
    );
    expect(serviceDeliveryMigration).toContain(
      "primary key (delivery_id, position)",
    );
  });

  it("serializes capacity checks per Service listing", () => {
    expect(serviceDeliveryMigration).toContain(
      "pg_catalog.pg_advisory_xact_lock",
    );
    expect(serviceDeliveryMigration).toContain(
      "'service-delivery-capacity:' || v_source.service_item_id::text",
    );
    expect(serviceDeliveryMigration).toContain(
      "v_capacity := greatest(1, coalesce(v_source.max_concurrent_jobs, 1));",
    );
    expect(serviceDeliveryMigration).toContain(
      "'pending', 'in_progress', 'awaiting_acceptance',",
    );
    expect(serviceDeliveryMigration).toContain(
      "'revision_requested', 'disputed'",
    );
    expect(serviceDeliveryMigration).toContain(
      "Service provider capacity is unavailable.",
    );
  });

  it("enforces provider delivery and recipient acceptance or revision", () => {
    expect(serviceDeliveryMigration).toContain(
      "public.mutate_service_delivery_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "'start', 'submit_milestone', 'accept_milestone',",
    );
    expect(serviceDeliveryMigration).toContain(
      "'request_revision', 'report_missed_deadline'",
    );
    expect(serviceDeliveryMigration).toContain(
      "Only the Service provider may start delivery.",
    );
    expect(serviceDeliveryMigration).toContain(
      "Only the Service provider may submit a milestone.",
    );
    expect(serviceDeliveryMigration).toContain(
      "Only the Service recipient may accept a milestone.",
    );
    expect(serviceDeliveryMigration).toContain(
      "Only the Service recipient may request a revision.",
    );
    expect(serviceDeliveryMigration).toContain(
      "Service milestones must be delivered in Agreement order.",
    );
    expect(serviceDeliveryMigration).toContain(
      "set status = 'awaiting_acceptance'",
    );
    expect(serviceDeliveryMigration).toContain(
      "set status = 'revision_requested'",
    );
    expect(serviceDeliveryMigration).toContain(
      "set status = 'completed'",
    );
  });

  it("provides exact replay, stale-revision rejection and per-command locking", () => {
    expect(serviceDeliveryMigration).toContain(
      "public.service_delivery_mutation_receipts",
    );
    expect(serviceDeliveryMigration).toContain("extensions.digest(");
    expect(serviceDeliveryMigration).toContain(
      "'service-delivery-receipt:' || v_actor::text || ':' || p_delivery_id::text || ':' || p_idempotency_key",
    );
    expect(serviceDeliveryMigration).toContain(
      "return v_receipt.response || jsonb_build_object('replayed', true);",
    );
    expect(serviceDeliveryMigration).toContain(
      "Idempotency key already used with another Service delivery request.",
    );
    expect(serviceDeliveryMigration).toContain(
      "Stale Service delivery revision: expected %s, current %s.",
    );
    expect(serviceDeliveryMigration).toContain("errcode = '40001'");
  });

  it("gates Exchange completion on accepted Service delivery", () => {
    expect(serviceDeliveryMigration).toContain(
      "private.service_delivery_completion_guard_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "create trigger aaa_service_delivery_completion_guard_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "before update of status on public.swaps",
    );
    expect(serviceDeliveryMigration).toContain(
      "Every Service delivery must be accepted before Exchange completion.",
    );
    expect(serviceDeliveryMigration).toContain(
      "d.status <> 'completed'",
    );
  });

  it("routes missed deadlines into the canonical dispute authority", () => {
    expect(serviceDeliveryMigration).toContain(
      "Only the Service recipient may report a missed deadline.",
    );
    expect(serviceDeliveryMigration).toContain(
      "clock_timestamp() <= v_delivery.deadline_at",
    );
    expect(serviceDeliveryMigration).toContain(
      "perform public.open_swap_dispute_v1(",
    );
    expect(serviceDeliveryMigration).toContain("'no_show'");
    expect(serviceDeliveryMigration).toContain(
      "'service:' || p_idempotency_key",
    );
  });

  it("synchronizes cancellation, active disputes and terminal resolutions", () => {
    expect(serviceDeliveryMigration).toContain(
      "private.sync_service_deliveries_from_swap_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "new.status in ('cancelled', 'rejected', 'expired')",
    );
    expect(serviceDeliveryMigration).toContain(
      "new.status = 'disputed'",
    );
    expect(serviceDeliveryMigration).toContain(
      "create trigger sync_service_deliveries_from_swap_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "private.resolve_service_deliveries_from_dispute_v1",
    );
    expect(serviceDeliveryMigration).toContain(
      "new.status in ('resolved_requester', 'resolved_responder', 'resolved_split', 'rejected')",
    );
    expect(serviceDeliveryMigration).toContain(
      "create trigger resolve_service_deliveries_from_dispute_v1",
    );
  });

  it("exposes only authenticated participant RPCs", () => {
    expect(serviceDeliveryMigration).toContain(
      "revoke all on function public.get_service_deliveries_v1(uuid)",
    );
    expect(serviceDeliveryMigration).toContain(
      "grant execute on function public.get_service_deliveries_v1(uuid)",
    );
    expect(serviceDeliveryMigration).toContain(
      "revoke all on function public.mutate_service_delivery_v1(uuid, text, bigint, integer, jsonb, text)",
    );
    expect(serviceDeliveryMigration).toContain(
      "grant execute on function public.mutate_service_delivery_v1(uuid, text, bigint, integer, jsonb, text)",
    );
    expect(serviceDeliveryMigration).toContain("from public, anon;");
    expect(serviceDeliveryMigration).toContain("to authenticated;");
    expect(serviceDeliveryMigration).toContain(
      "revoke all on function private.service_delivery_response_v1(uuid)",
    );
    expect(serviceDeliveryMigration).toContain(
      "from public, anon, authenticated, service_role;",
    );
  });
});
