import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const migration = read(
  "supabase/migrations/20260808214500_v1_09_6_public_coordinate_precision_guard.sql",
);

const createAuthority = read(
  "supabase/migrations/20260731183000_v1_05_2_canonical_domain_listing_create_authority.sql",
);

const privacyReplay = read("docs/V1-09.4.3_PRIVACY_AUTHORITY_REPLAY.md");

describe("V1-09.6 public coordinate privacy guard", () => {
  it("keeps exact location in the private authority boundary", () => {
    expect(createAuthority).toContain("exact_location jsonb not null");
    expect(createAuthority).toContain(
      "revoke all on table public.domain_listing_private_data from public, anon",
    );
    expect(privacyReplay).toContain(
      "exact domain-listing location is stored in `domain_listing_private_data.exact_location`",
    );
  });

  it("enforces approximate public property coordinates at storage level", () => {
    expect(migration).toContain("properties_public_coordinates_approximate");
    expect(migration).toContain("lat is null or scale(lat) <= 2");
    expect(migration).toContain("lon is null or scale(lon) <= 2");
    expect(migration).toContain(
      "validate constraint properties_public_coordinates_approximate",
    );
  });

  it("enforces the same invariant for public event coordinates", () => {
    expect(migration).toContain("events_listings_public_coordinates_approximate");
    expect(migration).toContain(
      "validate constraint events_listings_public_coordinates_approximate",
    );
  });

  it("does not revoke public browsing or remove approximate coordinate columns", () => {
    expect(migration).not.toContain("revoke select");
    expect(migration).not.toContain("drop column lat");
    expect(migration).not.toContain("drop column lon");
  });
});
