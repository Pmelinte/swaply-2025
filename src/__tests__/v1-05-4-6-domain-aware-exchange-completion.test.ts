import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260803043000_v1_05_4_6_domain_aware_exchange_completion.sql",
  ),
  "utf8",
);

const governance = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "supabase/migration-governance/forward-epoch.json",
    ),
    "utf8",
  ),
) as {
  forward_migrations?: Array<{ path?: string; name?: string }>;
};

describe("V1-05.4.6 domain-aware Exchange completion", () => {
  it("registers one shared fail-closed readiness authority for all domain ledgers", () => {
    expect(migration).toContain("private.domain_completion_readiness_v1");
    expect(migration).toContain("private.require_domain_completion_ready_v1");
    expect(migration).toContain("domain_agreement_required");
    expect(migration).toContain("domain_terms_mismatch");
    expect(migration).toContain("property_reservations_not_ready");
    expect(migration).toContain("service_deliveries_not_ready");
    expect(migration).toContain("event_transfers_not_ready");
    expect(migration).toContain(
      "Domain completion prerequisites are not satisfied.",
    );
  });

  it("blocks premature participant confirmation and direct completion transitions", () => {
    expect(migration).toContain(
      "aaa_domain_completion_confirmation_guard_v1",
    );
    expect(migration).toContain(
      "before insert on public.swap_completion_confirmations",
    );
    expect(migration).toContain(
      "aaa_domain_aware_swap_completion_guard_v1",
    );
    expect(migration).toContain("before update of status on public.swaps");
  });

  it("exposes only participant-safe readiness counts", () => {
    expect(migration).toContain("public.get_domain_completion_readiness_v1");
    expect(migration).toContain("Exchange completion access denied.");
    expect(migration).toContain("'expected', jsonb_build_object");
    expect(migration).toContain("'ready_ledgers', jsonb_build_object");
    expect(migration).not.toContain("event_proofs");
    expect(migration).not.toContain("submission_evidence");
    expect(migration).not.toContain("exact_address");
  });

  it("consumes Objects but preserves reusable Property, Service and Event listings", () => {
    expect(migration).toContain(
      "when item_type = 'object' then 'traded'",
    );
    expect(migration).toContain(
      "when item_type = 'object' then false",
    );
    expect(migration).toContain(
      "where item_row.item_type in ('property', 'service', 'event')",
    );
    expect(migration).toContain("reusable_domain_items_preserved");
    expect(migration).toContain("domain_aware_structural_effects");
    expect(migration).toContain(
      "public.apply_swap_post_completion_effects_v1",
    );
  });

  it("is registered as a forward-only migration", () => {
    expect(governance.forward_migrations).toContainEqual(
      expect.objectContaining({
        path: "supabase/migrations/20260803043000_v1_05_4_6_domain_aware_exchange_completion.sql",
        name: "v1_05_4_6_domain_aware_exchange_completion",
      }),
    );
  });
});
