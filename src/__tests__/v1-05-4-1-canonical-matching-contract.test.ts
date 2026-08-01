import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260801163000_v1_05_4_1_canonical_cross_domain_matching.sql",
  ),
  "utf8",
);
const queries = readFileSync(
  resolve(process.cwd(), "src/lib/matching/matchQueries.ts"),
  "utf8",
);
const scoring = readFileSync(
  resolve(process.cwd(), "src/lib/matching/matchScore.ts"),
  "utf8",
);
const page = readFileSync(
  resolve(process.cwd(), "src/components/matching/MatchingPage.tsx"),
  "utf8",
);
const slots = readFileSync(
  resolve(process.cwd(), "src/components/matching/MatchingSlots.tsx"),
  "utf8",
);
const route = readFileSync(
  resolve(process.cwd(), "src/app/[locale]/matching/page.tsx"),
  "utf8",
);
const aiRoute = readFileSync(
  resolve(process.cwd(), "src/app/api/matching/ai/route.ts"),
  "utf8",
);

describe("V1-05.4.1 canonical cross-domain matching", () => {
  it("projects all four domains from items plus dedicated canonical tables", () => {
    expect(migration).toContain("create or replace view public.matching_items_v1");
    expect(migration).toContain("with (security_invoker = true, security_barrier = true)");
    expect(migration).toContain("left join public.properties p");
    expect(migration).toContain("left join public.services_listings s");
    expect(migration).toContain("left join public.events_listings e");
    expect(migration).toContain("when 'object' then true");
    expect(migration).toContain("when 'property' then");
    expect(migration).toContain("when 'service' then");
    expect(migration).toContain("when 'event' then");
    expect(migration).toContain("transfer_rule_confirmed");
    expect(migration).toContain("capacity_available");
  });

  it("keeps private location and event transfer secrets out of matching projection", () => {
    expect(migration).not.toContain("booking_reference");
    expect(migration).not.toContain("venue_row");
    expect(migration).not.toContain("venue_seat");
    expect(migration).not.toContain("property_manager_contact");
    expect(migration).not.toContain("insurance_provider");
    expect(migration).not.toContain("domain_listing_private_data");
  });

  it("removes every legacy JSON matching dependency", () => {
    for (const source of [queries, scoring, page, aiRoute]) {
      expect(source).not.toContain("property_data");
      expect(source).not.toContain("service_data");
      expect(source).not.toContain("event_data");
    }
    expect(queries).toContain('.from("matching_items_v1")');
    expect(queries).toContain("fetchOwnActiveItems");
  });

  it("validates mutual domain compatibility both when expressing and accepting interest", () => {
    expect(migration).toContain(
      "create or replace function private.matching_pair_allowed_v1",
    );
    expect(
      migration.match(/private\.matching_pair_allowed_v1\(/g)?.length,
    ).toBeGreaterThanOrEqual(3);
    expect(migration).toContain("DOMAIN_PAIR_NOT_ALLOWED");
    expect(migration).toContain("SOURCE_ITEM_OWNER_REQUIRED");
    expect(migration).toContain("INTEREST_RECIPIENT_REQUIRED");
  });

  it("uses only a user's own active listings as offered slots", () => {
    expect(page).toContain("fetchOwnActiveItems");
    expect(page).toContain("item.owner_id !== userId");
    expect(page).toContain("isMatchingPairCompatible(source, item)");
    expect(page).toContain("sourceItemId: best.source.id");
    expect(slots).toContain("ownItems");
    expect(slots).toContain("onSelectSlot1");
    expect(slots).toContain("onSelectSlot2");
    expect(slots).not.toContain('href="/objects"');
  });

  it("consumes target and constrains AI to deterministic compatible candidates", () => {
    expect(route).toContain("parameters.target");
    expect(route).toContain("initialTarget={target}");
    expect(page).toContain("initialTarget");
    expect(aiRoute).toContain("isMatchingPairCompatible(myItem, candidate)");
    expect(aiRoute).toContain("calculateMatchScore");
    expect(aiRoute).toContain("do not alter the deterministic score");
  });
});
