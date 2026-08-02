import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDomainTermsFromContext,
  domainTermsAreComplete,
  parseMatchAgreementContext,
  parseMatchAgreementDomainTerms,
} from "@/lib/chat/domainAgreement";

const authorityMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260802100000_v1_05_4_2_domain_aware_agreement.sql",
  ),
  "utf8",
);
const handoffMigration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260802101500_v1_05_4_2_domain_exchange_handoff.sql",
  ),
  "utf8",
);
const chatQueries = readFileSync(
  resolve(process.cwd(), "src/lib/chat/chatQueries.ts"),
  "utf8",
);
const panel = readFileSync(
  resolve(process.cwd(), "src/components/chat/MatchAgreementPanel.tsx"),
  "utf8",
);

describe("V1-05.4.2 domain agreement client contracts", () => {
  it("builds one Property, Service or Event contract for every non-object item", () => {
    const context = parseMatchAgreementContext({
      conversation_id: "conversation-a",
      items: [
        {
          item_id: "property-a",
          owner_id: "user-a",
          domain: "property",
          title: "Home",
          defaults: {
            period_start: "2026-09-01",
            period_end: "2026-09-07",
            timezone: "UTC",
            exchange_mode: "simultaneous",
            guests: 2,
            rules: "No smoking",
            security_deposit_eur: 0,
            insurance_confirmed: true,
            check_in_time: "15:00",
            check_out_time: "11:00",
            handover_notes: "Meet at reception",
          },
        },
        {
          item_id: "object-b",
          owner_id: "user-b",
          domain: "object",
          title: "Camera",
          defaults: {},
        },
      ],
    });

    expect(context).not.toBeNull();
    const terms = buildDomainTermsFromContext(context);
    expect(terms).toHaveLength(1);
    expect(terms[0]).toMatchObject({
      item_id: "property-a",
      domain: "property",
    });
    expect(domainTermsAreComplete(context, terms)).toBe(true);
  });

  it("fails closed when mandatory service or event terms are missing", () => {
    const context = parseMatchAgreementContext({
      conversation_id: "conversation-b",
      items: [
        {
          item_id: "service-a",
          owner_id: "user-a",
          domain: "service",
          title: "Audit",
          defaults: {},
        },
        {
          item_id: "event-b",
          owner_id: "user-b",
          domain: "event",
          title: "Ticket",
          defaults: {},
        },
      ],
    });

    const terms = buildDomainTermsFromContext(context);
    expect(domainTermsAreComplete(context, terms)).toBe(false);
  });

  it("normalizes only valid domain term envelopes", () => {
    expect(
      parseMatchAgreementDomainTerms([
        {
          item_id: "service-a",
          domain: "service",
          terms: {
            delivery_mode: "remote",
            timezone: "UTC",
            deliverables: ["Report"],
            duration_hours: 2,
            duration_days: 0,
            deadline_at: "2026-09-01T12:00:00Z",
            milestones: ["Draft", "Final"],
            acceptance_criteria: "Written acceptance",
            no_show_terms: "Reschedule once",
            cancellation_terms: "Cancel 24h before",
            dispute_terms: "Use Swaply dispute flow",
          },
        },
        { item_id: "bad", domain: "object", terms: {} },
      ]),
    ).toHaveLength(1);
  });
});

describe("V1-05.4.2 server authority contract", () => {
  it("adds participant-only context and exact-once mutation receipts", () => {
    expect(authorityMigration).toContain(
      "create table if not exists public.match_agreement_mutation_receipts",
    );
    expect(authorityMigration).toContain(
      "create or replace function public.get_match_agreement_context_v1",
    );
    expect(authorityMigration).toContain(
      "create or replace function public.update_match_conversation_agreement_v2",
    );
    expect(authorityMigration).toContain("p_idempotency_key text");
    expect(authorityMigration).toContain("v_existing_receipt.request_hash");
    expect(authorityMigration).toContain("Agreement revision conflict.");
  });

  it("requires complete Property, Service and Event terms", () => {
    expect(authorityMigration).toContain(
      "private.validate_match_agreement_domain_terms_v1",
    );
    expect(authorityMigration).toContain("Property agreement terms are incomplete.");
    expect(authorityMigration).toContain("Service agreement terms are incomplete.");
    expect(authorityMigration).toContain(
      "Event agreement terms are incomplete or incompatible with issuer rules.",
    );
    expect(authorityMigration).toContain("content_hash");
    expect(authorityMigration).toContain("confirmations");
  });

  it("freezes the complete domain agreement into the Exchange", () => {
    expect(handoffMigration).toContain(
      "private.create_exchange_from_domain_agreement_v1",
    );
    expect(handoffMigration).toContain("agreement_snapshot");
    expect(handoffMigration).toContain("domain_terms");
    expect(handoffMigration).toContain("agreement_hash");
    expect(handoffMigration).toContain(
      "Both participants must confirm the same domain agreement revision and hash.",
    );
  });

  it("routes the UI through context, domain completion and the V2 authority", () => {
    expect(chatQueries).toContain("get_match_agreement_context_v1");
    expect(chatQueries).toContain("update_match_conversation_agreement_v2");
    expect(chatQueries).toContain("p_idempotency_key");
    expect(panel).toContain("DomainAgreementTermsEditor");
    expect(panel).toContain("domainTermsAreComplete");
    expect(panel).toContain('agreement.schema_version === "3.0"');
  });
});
