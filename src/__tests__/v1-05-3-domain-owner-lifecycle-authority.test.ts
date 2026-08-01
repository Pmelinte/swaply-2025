import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260801133000_v1_05_3_domain_owner_lifecycle_authority.sql",
  ),
  "utf8",
);
const editorHardeningMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260801142000_v1_05_3_editor_payload_hardening.sql",
  ),
  "utf8",
);
const createRoute = readFileSync(
  resolve(process.cwd(), "src/lib/listings/domainListingCreateRoute.ts"),
  "utf8",
);
const mutationRoute = readFileSync(
  resolve(process.cwd(), "src/lib/listings/domainListingMutationRoute.ts"),
  "utf8",
);
const mutationSubmit = readFileSync(
  resolve(process.cwd(), "src/lib/listings/domainListingMutationSubmit.ts"),
  "utf8",
);
const propertyRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/properties/[id]/route.ts"),
  "utf8",
);
const serviceRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/services/[id]/route.ts"),
  "utf8",
);
const eventRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/events/[id]/route.ts"),
  "utf8",
);
const propertyStatusRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/properties/[id]/status/route.ts"),
  "utf8",
);
const serviceStatusRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/services/[id]/status/route.ts"),
  "utf8",
);
const eventStatusRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/items/events/[id]/status/route.ts"),
  "utf8",
);
const ownerActions = readFileSync(
  resolve(process.cwd(), "src/components/listings/DomainListingOwnerActions.tsx"),
  "utf8",
);
const editLoader = readFileSync(
  resolve(process.cwd(), "src/components/listings/DomainListingEditPage.tsx"),
  "utf8",
);
const propertyWizard = readFileSync(
  resolve(process.cwd(), "src/components/wizard/property/PropertyWizard.tsx"),
  "utf8",
);
const serviceWizard = readFileSync(
  resolve(process.cwd(), "src/components/wizard/service/ServiceWizard.tsx"),
  "utf8",
);
const eventWizard = readFileSync(
  resolve(process.cwd(), "src/components/wizard/event/EventWizard.tsx"),
  "utf8",
);

describe("V1-05.3 canonical owner lifecycle authority", () => {
  it("binds edit and lifecycle mutations to the authenticated owner", () => {
    expect(migration).toContain(
      "create or replace function public.update_domain_listing_v1",
    );
    expect(migration).toContain(
      "create or replace function public.set_domain_listing_status_v1",
    );
    expect(migration.match(/security definer/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration.match(/v_actor uuid := auth.uid\(\)/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration).toContain("v_owner_id <> v_actor or v_item_type <> v_domain");
    expect(migration).toContain(
      "Listing is not owned by the authenticated actor.",
    );
  });

  it("uses optimistic revisions and exact-once receipts before stale checks", () => {
    expect(migration).toContain("add column if not exists owner_revision bigint");
    expect(migration).toContain("domain_listing_mutation_receipts");
    expect(migration).toContain(
      "primary key (actor_id, item_id, operation, idempotency_key)",
    );
    expect(migration.match(/pg_advisory_xact_lock/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration.match(/v_existing.request_hash <> v_request_hash/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration.match(/'replayed', true/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration.match(/Listing revision is stale\./g)?.length).toBeGreaterThanOrEqual(2);

    const editReceiptLookup = migration.indexOf(
      "operation = 'edit'\n    and idempotency_key",
    );
    const editRevisionCheck = migration.indexOf(
      "if v_current_revision <> p_expected_revision then",
    );
    expect(editReceiptLookup).toBeGreaterThan(-1);
    expect(editRevisionCheck).toBeGreaterThan(editReceiptLookup);
  });

  it("updates items, dedicated rows and private projection atomically", () => {
    expect(migration).toContain("update public.items i");
    expect(migration).toContain("jsonb_populate_record(null::public.%I, $1)");
    expect(migration).toContain("where t.item_id = $2 and t.owner_id = $3");
    expect(migration).toContain("insert into public.domain_listing_private_data");
    expect(migration).toContain("on conflict (item_id) do update");
    expect(migration.trim().endsWith("commit;")).toBe(true);
  });

  it("keeps pause, resume and archive synchronized and refuses expired event resume", () => {
    expect(migration).toContain(
      "v_target_status not in ('active', 'paused', 'archived')",
    );
    expect(migration).toContain("is_active = (v_target_status = 'active')");
    expect(migration).toContain(
      "update public.%I set status = $1, updated_at = now()",
    );
    expect(migration).toContain("Expired events cannot be resumed.");
  });

  it("removes direct domain writes while retaining owner reads for inactive rows", () => {
    expect(migration).toContain(
      "revoke insert, update, delete on table public.properties from authenticated",
    );
    expect(migration).toContain(
      "revoke insert, update, delete on table public.services_listings from authenticated",
    );
    expect(migration).toContain(
      "revoke insert, update, delete on table public.events_listings from authenticated",
    );
    expect(migration).toContain("create policy properties_select_own");
    expect(migration).toContain("create policy services_select_own");
    expect(migration).toContain("create policy events_select_own");
    expect(migration).toContain("and item_type = 'object'");
    expect(migration).toContain(
      "revoke all on table public.domain_listing_mutation_receipts",
    );
  });

  it("bounds editor metadata at both route and database layers", () => {
    for (const route of [createRoute, mutationRoute]) {
      expect(route).toContain('schema_version: "1.0"');
      expect(route).toContain('source: `${domain}_wizard`');
      expect(route).not.toContain("...payload.private.editor_payload");
    }
    expect(editorHardeningMigration).toContain(
      "domain_listing_private_editor_payload_bounded",
    );
    expect(editorHardeningMigration).toContain(
      "editor_payload = jsonb_build_object(",
    );
    expect(editorHardeningMigration).toContain(
      "'source', domain || '_wizard'",
    );
  });

  it("exposes only authenticated, versioned, idempotent API routes", () => {
    expect(mutationRoute).toContain("supabase.auth.getUser()");
    expect(mutationRoute).toContain('request.headers.get("idempotency-key")');
    expect(mutationRoute).toContain("expectedRevision");
    expect(mutationRoute).toContain('p_expected_revision: body.expectedRevision');
    expect(mutationRoute).toContain('p_idempotency_key: key');
    expect(mutationRoute).toContain(
      'new Set(["active", "paused", "archived"])',
    );
    expect(mutationSubmit).toContain("requestFingerprint");
    expect(mutationSubmit).toContain('"idempotency-key": key');
    expect(mutationSubmit).toContain("expectedRevision");
  });

  it("routes every domain through the same canonical edit and lifecycle authority", () => {
    for (const route of [propertyRoute, serviceRoute, eventRoute]) {
      expect(route).toContain("updateDomainListingResponse");
      expect(route).not.toContain("service_data");
      expect(route).not.toContain("event_data");
      expect(route).not.toContain("property_data");
    }
    for (const route of [
      propertyStatusRoute,
      serviceStatusRoute,
      eventStatusRoute,
    ]) {
      expect(route).toContain("setDomainListingStatusResponse");
    }
  });

  it("provides localized edit, pause/resume and archive controls", () => {
    expect(ownerActions).toContain('useTranslations("common")');
    expect(ownerActions).toContain('useTranslations("myObjects")');
    expect(ownerActions).toContain('useTranslations("objects")');
    expect(ownerActions).toContain('useTranslations("admin")');
    expect(ownerActions).toContain('tc("edit")');
    expect(ownerActions).toContain('tm("pause")');
    expect(ownerActions).toContain('tm("resume")');
    expect(ownerActions).toContain('tm("archive")');
    expect(ownerActions).toContain("setDomainListingStatus");
    expect(ownerActions).not.toContain("Owner controls");
    expect(editLoader).toContain('useTranslations("common")');
    expect(editLoader).toContain('tc("loading")');
    expect(editLoader).toContain('tc("errorOccurred")');
    expect(editLoader).toContain('mode="edit"');
    expect(editLoader).not.toContain("Loading owner editor");

    for (const wizard of [propertyWizard, serviceWizard, eventWizard]) {
      expect(wizard).toContain('useTranslations("common")');
      expect(wizard).toContain('tc("edit")');
      expect(wizard).toContain('tc("save")');
      expect(wizard).not.toMatch(/Editing your (property|service|event)/);
      expect(wizard).not.toMatch(/updated successfully/);
      expect(wizard).not.toContain("Save changes");
    }
  });
});
