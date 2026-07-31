import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260731183000_v1_05_2_canonical_domain_listing_create_authority.sql",
);
const migration = readFileSync(migrationPath, "utf8");

const propertySubmit = readFileSync(
  resolve(process.cwd(), "src/lib/wizard/propertyWizardSubmit.ts"),
  "utf8",
);
const serviceRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/services/route.ts"),
  "utf8",
);
const eventRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/events/route.ts"),
  "utf8",
);
const payloadNormalizer = readFileSync(
  resolve(process.cwd(), "src/lib/listings/domainListingPayload.ts"),
  "utf8",
);

describe("V1-05.2 canonical domain listing create authority", () => {
  it("creates items and the dedicated domain row in one SECURITY DEFINER transaction", () => {
    expect(migration).toContain("create or replace function public.create_domain_listing_v1");
    expect(migration).toContain("security definer");
    expect(migration).toContain("v_actor uuid := auth.uid()");
    expect(migration).toContain("insert into public.items");
    expect(migration).toContain("jsonb_populate_record");
    expect(migration).toContain("returning id into v_listing_id");
    expect(migration.trim().endsWith("commit;")).toBe(true);
  });

  it("provides exact-once replay and rejects key reuse with another payload", () => {
    expect(migration).toContain("domain_listing_create_receipts");
    expect(migration).toContain("primary key (actor_id, domain, idempotency_key)");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("v_existing.request_hash <> v_request_hash");
    expect(migration).toContain("Idempotency key was already used with a different request.");
    expect(migration).toContain("'replayed', true");
  });

  it("keeps private editor, exact location and transfer data owner-only", () => {
    expect(migration).toContain("create table if not exists public.domain_listing_private_data");
    expect(migration).toContain("alter table public.domain_listing_private_data enable row level security");
    expect(migration).toContain("domain_listing_private_select_own");
    expect(migration).toContain("owner_id = (select auth.uid())");
    expect(migration).toContain(
      "revoke all on table public.domain_listing_private_data from public, anon",
    );
    expect(migration).toContain("Private event transfer fields cannot be public.");
    expect(migration).toContain("Wi-Fi credentials cannot be stored.");
  });

  it("prevents partial or duplicate domain persistence", () => {
    expect(migration).toContain("create unique index if not exists uq_properties_item_id");
    expect(migration).toContain("create unique index if not exists uq_services_listings_item_id");
    expect(migration).toContain("create unique index if not exists uq_events_listings_item_id");
    expect(migration).toContain("revoke insert on table public.properties from authenticated");
    expect(migration).toContain("revoke insert on table public.services_listings from authenticated");
    expect(migration).toContain("revoke insert on table public.events_listings from authenticated");
    expect(migration).toContain("and item_type = 'object'");
  });

  it("limits RPC execution to authenticated users", () => {
    const signature = "public.create_domain_listing_v1(text, jsonb, text)";
    expect(migration).toContain(`revoke all on function ${signature}`);
    expect(migration).toContain("from public, anon");
    expect(migration).toContain(`grant execute on function ${signature}`);
    expect(migration).toContain("to authenticated");
  });

  it("removes the three legacy domain JSON write paths", () => {
    expect(propertySubmit).toContain('/api/items/properties');
    expect(propertySubmit).not.toContain('.from("items")');
    expect(serviceRoute).toContain("createDomainListingResponse");
    expect(eventRoute).toContain("createDomainListingResponse");
    expect(payloadNormalizer).not.toContain("property_data:");
    expect(payloadNormalizer).not.toContain("service_data:");
    expect(payloadNormalizer).not.toContain("event_data:");
    expect(payloadNormalizer).not.toContain("owner_id:");
    expect(payloadNormalizer).not.toContain("wizard_type:");
    expect(payloadNormalizer).not.toContain("wizard_step:");
  });
});
