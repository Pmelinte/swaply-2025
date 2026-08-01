import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const route = readFileSync(
  resolve(process.cwd(), "src/lib/listings/domainListingCreateRoute.ts"),
  "utf8",
);

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260801123000_v1_05_2_final_review_fail_closed_hardening.sql",
  ),
  "utf8",
);

describe("V1-05.2 final review hardening", () => {
  it("fails closed when canonical value tiers are missing or invalid", () => {
    expect(route).toContain("assertRequiredValueTiers");
    expect(route).toContain('"INVALID_VALUE_TIER"');
    expect(route).toContain("payload.item.perceived_value_tier");
    expect(route).toContain("payload.item.swap_wants_value_tier");
    expect(route).toContain("payload.listing.swap_wants_value_tier");

    expect(migration).toContain("Canonical value tiers are required.");
    expect(migration).toContain("v_domain in ('service', 'event')");
    expect(migration).toContain("v_item ->> 'perceived_value_tier'");
    expect(migration).toContain("v_item ->> 'swap_wants_value_tier'");
    expect(migration).toContain("v_listing ->> 'swap_wants_value_tier'");
  });

  it("persists only bounded server-generated editor metadata", () => {
    expect(route).toContain("boundEditorPayload");
    expect(route).toContain('schema_version: "1.0"');
    expect(route).toContain('source: `${domain}_wizard`');

    expect(migration).toContain("v_allowed_editor_keys constant text[]");
    expect(migration).toContain("'schema_version', 'source'");
    expect(migration).toContain("Unsupported editor metadata field:");
    expect(migration).toContain("Invalid editor metadata.");
    expect(migration).toContain("Credential-bearing editor metadata is forbidden.");
  });

  it("keeps the previous validated wrapper private and non-executable by clients", () => {
    expect(migration).toContain(
      "rename to create_domain_listing_v1_validated_core",
    );
    expect(migration).toContain(
      "revoke all on function private.create_domain_listing_v1_validated_core(text, jsonb, text)",
    );
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain(
      "return private.create_domain_listing_v1_validated_core",
    );
  });

  it("returns a generic HTTP-link validation message for every affected field", () => {
    expect(route).toContain('error.code === "INVALID_URL"');
    expect(route).toContain("Links must be valid HTTP URLs.");
  });
});
