import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260801112400_v1_05_2_domain_listing_create_rpc_hardening.sql",
  ),
  "utf8",
);

function extractAllowlist(name: string): string {
  const match = migration.match(
    new RegExp(`${name} constant text\\[\\] := array\\[(.*?)\\];`, "s"),
  );
  expect(match, `${name} allowlist must exist`).not.toBeNull();
  return match?.[1] ?? "";
}

describe("V1-05.2 direct RPC fail-closed hardening", () => {
  it("moves the atomic persistence core outside the exposed public schema", () => {
    expect(migration).toContain(
      "alter function public.create_domain_listing_v1(text, jsonb, text)",
    );
    expect(migration).toContain("set schema private");
    expect(migration).toContain(
      "rename to create_domain_listing_v1_core",
    );
    expect(migration).toContain(
      "revoke all on function private.create_domain_listing_v1_core(text, jsonb, text)",
    );
    expect(migration).toContain("from public, anon, authenticated");
  });

  it("keeps only the strict authenticated wrapper publicly executable", () => {
    expect(migration).toContain(
      "create or replace function public.create_domain_listing_v1",
    );
    expect(migration).toContain(
      "return private.create_domain_listing_v1_core",
    );
    expect(migration).toContain(
      "revoke all on function public.create_domain_listing_v1(text, jsonb, text)",
    );
    expect(migration).toContain("from public, anon");
    expect(migration).toContain(
      "grant execute on function public.create_domain_listing_v1(text, jsonb, text)",
    );
    expect(migration).toContain("to authenticated");
  });

  it("rejects unknown top-level, private, item and per-domain listing keys", () => {
    expect(migration).toContain("Unsupported payload field:");
    expect(migration).toContain("Unsupported private payload field:");
    expect(migration).toContain("Unsupported item field:");
    expect(migration).toContain("Unsupported %s listing field:");

    const payloadKeys = extractAllowlist("v_allowed_payload_keys");
    expect(payloadKeys).toContain("'schema_version'");
    expect(payloadKeys).toContain("'domain'");
    expect(payloadKeys).toContain("'item'");
    expect(payloadKeys).toContain("'listing'");
    expect(payloadKeys).toContain("'private'");
  });

  it("does not allow clients to set verification, moderation, ranking or promotion state", () => {
    const propertyKeys = extractAllowlist("v_allowed_property_listing_keys");
    const serviceKeys = extractAllowlist("v_allowed_service_listing_keys");
    const eventKeys = extractAllowlist("v_allowed_event_listing_keys");

    for (const denied of [
      "property_verified",
      "documents_verified",
      "verified_by",
      "verification_method",
      "internal_notes",
      "average_rating",
      "review_count",
      "views_count",
      "favorites_count",
      "is_featured",
      "is_boosted",
      "boosted_until",
      "seo_slug",
    ]) {
      expect(propertyKeys).not.toContain(`'${denied}'`);
    }

    for (const denied of [
      "license_number",
      "license_issuer",
      "insurance_provider",
      "average_rating",
      "review_count",
      "views_count",
      "favorites_count",
      "is_featured",
      "is_boosted",
      "boosted_until",
      "seo_slug",
    ]) {
      expect(serviceKeys).not.toContain(`'${denied}'`);
    }

    for (const denied of [
      "booking_reference",
      "address",
      "online_url",
      "seat_info",
      "venue_row",
      "venue_seat",
      "average_rating",
      "review_count",
      "views_count",
      "favorites_count",
      "is_featured",
      "is_boosted",
      "boosted_until",
      "seo_slug",
    ]) {
      expect(eventKeys).not.toContain(`'${denied}'`);
    }
  });

  it("enforces JSON types, HTTP media URLs and approximate public coordinates", () => {
    expect(migration).toContain("Item array fields must be arrays.");
    expect(migration).toContain("Item arrays must contain strings only.");
    expect(migration).toContain("Item images must use HTTP URLs.");
    expect(migration).toContain("must be a boolean.");
    expect(migration).toContain("must be an integer.");
    expect(migration).toContain("must be a number.");
    expect(migration).toContain("must contain strings only.");
    expect(migration).toContain(
      "Public coordinates must be approximate and in range.",
    );
    expect(migration).toContain("A supported explicit timezone is required.");
    expect(migration).toContain(
      "Properties may be created only for temporary vacation exchange.",
    );
  });

  it("limits exact location and transfer-only data by domain", () => {
    expect(migration).toContain(
      "v_allowed_exact_keys := array['address', 'lat', 'lon']",
    );
    expect(migration).toContain(
      "v_allowed_transfer_keys := array['certification_claims', 'provider_type']",
    );
    expect(migration).toContain("'booking_reference', 'venue_row', 'seat_number'");
    expect(migration).toContain("Unsupported exact location field:");
    expect(migration).toContain("Unsupported private transfer field:");
    expect(migration).toContain("Wi-Fi credentials cannot be stored.");
  });

  it("keeps service verification and concurrency values server-controlled", () => {
    expect(migration).toContain(
      "Service verification and concurrency fields are server-controlled.",
    );
    expect(migration).toContain(
      "v_listing -> 'is_licensed' is distinct from 'false'::jsonb",
    );
    expect(migration).toContain(
      "v_listing -> 'is_certified' is distinct from 'false'::jsonb",
    );
    expect(migration).toContain(
      "v_listing -> 'certifications' is distinct from '[]'::jsonb",
    );
    expect(migration).toContain(
      "v_listing -> 'max_concurrent_jobs' is distinct from '1'::jsonb",
    );
  });

  it("requires ticket transfer authority to be a user attestation", () => {
    expect(migration).toContain(
      "Ticket transfer authority must be an explicit user attestation.",
    );
    expect(migration).toContain(
      "v_listing ->> 'transfer_rule_source' is distinct from 'user_attestation'",
    );
    expect(migration).toContain(
      "Transfer authority fields are only valid for ticket events.",
    );
  });
});
