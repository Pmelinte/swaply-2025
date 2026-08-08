import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function between(source: string, start: string, end: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("V1-09.4.3 privacy authority contracts", () => {
  const exportRoute = read("src/app/api/gdpr/export/route.ts");
  const publicListingDetails = read("src/lib/listings/publicListingDetails.ts");
  const domainCreateMigration = read(
    "supabase/migrations/20260731183000_v1_05_2_canonical_domain_listing_create_authority.sql",
  );
  const conversationMigration = read(
    "supabase/migrations/20260713113902_batch_56_match_conversation.sql",
  );
  const finalRlsHardening = read(
    "supabase/migrations/20260731040000_v1_04_2b5_final_grants_rls_hardening.sql",
  );

  it("exports the personal-data categories promised by the account UI", () => {
    expect(exportRoute).toContain('.from("messages")');
    expect(exportRoute).toContain(
      '.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)',
    );
    expect(exportRoute).toContain('.from("conversations")');
    expect(exportRoute).toContain('.contains("participant_ids", [userId])');
    expect(exportRoute).toContain('.from("swaps")');
    expect(exportRoute).toContain('.from("user_tokens")');
    expect(exportRoute).toContain('.from("swapleni_accounts")');
    expect(exportRoute).toContain('.from("swapleni_ledger")');

    expect(exportRoute).toContain("messages: messages.data ?? []");
    expect(exportRoute).toContain("conversations: conversations.data ?? []");
    expect(exportRoute).toContain("userTokens: userTokens.data ?? []");
    expect(exportRoute).toContain("swapleniLedger: swapleniLedger.data ?? []");
  });

  it("uses the real GDPR request completion column from Production schema", () => {
    expect(exportRoute).toContain("processed_at");
    expect(exportRoute).not.toContain("completed_at");
  });

  it("keeps exact property coordinates and address out of the public detail projection", () => {
    const propertySelect = between(
      publicListingDetails,
      "export const PUBLIC_PROPERTY_DETAIL_SELECT",
      "export const PUBLIC_SERVICE_DETAIL_SELECT",
    );

    expect(propertySelect).toContain('"city"');
    expect(propertySelect).toContain('"country_code"');
    expect(propertySelect).not.toContain('"lat"');
    expect(propertySelect).not.toContain('"lon"');
    expect(propertySelect).not.toContain('"address"');
  });

  it("stores exact domain location privately and constrains public coordinates to approximation", () => {
    expect(domainCreateMigration).toContain("exact_location jsonb not null");
    expect(domainCreateMigration).toContain(
      "revoke all on table public.domain_listing_private_data from public, anon",
    );
    expect(domainCreateMigration).toContain(
      "using (owner_id = (select auth.uid()))",
    );
    expect(domainCreateMigration).toContain(
      "scale((v_listing ->> 'lat')::numeric) > 2",
    );
    expect(domainCreateMigration).toContain(
      "scale((v_listing ->> 'lon')::numeric) > 2",
    );
    expect(domainCreateMigration).toContain(
      "Public coordinates must be approximate.",
    );
  });

  it("keeps message creation and operational access participant-bound", () => {
    expect(conversationMigration).toContain("sender_id = auth.uid()");
    expect(conversationMigration).toContain(
      "messages.recipient_id = ANY (conversation_row.participant_ids)",
    );
    expect(conversationMigration).toContain(
      "cardinality(conversation_row.participant_ids) = 2",
    );
    expect(finalRlsHardening).toContain(
      "revoke delete on table public.messages from authenticated, anon",
    );
    expect(finalRlsHardening).toContain("auth.uid() = sender_id");
    expect(finalRlsHardening).toContain("auth.uid() = recipient_id");
  });
});
