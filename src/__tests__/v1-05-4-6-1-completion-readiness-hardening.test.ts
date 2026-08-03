import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migrationPath =
  "supabase/migrations/20260803054500_v1_05_4_6_1_completion_readiness_hardening.sql";

const migration = readFileSync(
  resolve(process.cwd(), migrationPath),
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
  forward_migrations?: Array<{
    path?: string;
    version?: string;
    name?: string;
    kind?: string;
  }>;
};

describe("V1-05.4.6.1 completion readiness hardening", () => {
  it("fails closed when the Agreement revision is NULL", () => {
    expect(migration).toContain(
      "coalesce(v_swap.agreement_revision, 0) < 1",
    );
    expect(migration).toContain(
      "v_swap.exchange_kind is distinct from 'bilateral'",
    );
  });

  it("requires every domain term to match the referenced item type", () => {
    expect(migration).toContain("left join public.items term_item");
    expect(migration).toContain("term_item.item_type::text");
    expect(migration).toContain(
      "is distinct from term.value ->> 'domain'",
    );
    expect(migration).toContain("domain_terms_mismatch");
  });

  it("preserves the participant-safe readiness response contract", () => {
    expect(migration).toContain("'ready', jsonb_array_length(v_blocked_by) = 0");
    expect(migration).toContain("'domain_aware', v_domain_contract_valid");
    expect(migration).toContain("'blocked_by', v_blocked_by");
    expect(migration).not.toContain("event_proofs");
    expect(migration).not.toContain("exact_address");
  });

  it("is registered as a forward-only migration", () => {
    expect(governance.forward_migrations).toContainEqual(
      expect.objectContaining({
        path: migrationPath,
        version: "20260803054500",
        name: "v1_05_4_6_1_completion_readiness_hardening",
        kind: "FORWARD_ONLY",
      }),
    );
  });
});
