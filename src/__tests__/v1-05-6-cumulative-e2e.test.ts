import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(
    process.cwd(),
    ".github/workflows/v1-05-6-cumulative-e2e.yml",
  ),
  "utf8",
);

const browserJourney = readFileSync(
  resolve(
    process.cwd(),
    "e2e/v1-05-6-domain-cumulative.spec.ts",
  ),
  "utf8",
);

const eventObjectReplay = readFileSync(
  resolve(
    process.cwd(),
    "supabase/tests/v1_05_6_event_object_e2e_replay.sql",
  ),
  "utf8",
);

describe("V1-05.6 cumulative domain E2E gate", () => {
  it("keeps the gate cumulative across repository, browser and authenticated authority", () => {
    expect(workflow).toContain("Repository, locale and build gate");
    expect(workflow).toContain("Public browser, mobile, LTR and RTL gate");
    expect(workflow).toContain(
      "Authenticated Property, Service and Event authority gate",
    );
    expect(workflow).toContain("npm run migration:guard");
    expect(workflow).toContain("npm run i18n:check");
    expect(workflow).toContain("npm run eval:ai");
    expect(workflow).toContain("npm run ci:quality");
  });

  it("replays inherited Property-Service and shared completion evidence on the same head", () => {
    expect(workflow).toContain(
      "v1_05_4_7_cross_domain_e2e_contract.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_7_cross_domain_e2e_replay.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_6_domain_aware_exchange_completion_replay.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_6_1_completion_readiness_hardening_replay.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_4_service_delivery_authority_replay.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_5_event_transfer_authority_replay.sql",
    );
  });

  it("adds one complete authenticated Event-to-Object authority journey", () => {
    for (const requiredAuthority of [
      "public.express_matching_interest",
      "public.accept_matching_interest",
      "insert into public.messages",
      "public.update_match_conversation_agreement_v2",
      "public.create_exchange_from_match_agreement",
      "public.mutate_event_transfer_v1",
      "public.get_domain_completion_readiness_v1",
      "public.confirm_swap_completion_v1",
    ]) {
      expect(eventObjectReplay).toContain(requiredAuthority);
    }

    expect(eventObjectReplay).toContain("'submit_proof'");
    expect(eventObjectReplay).toContain("'confirm_transfer'");
    expect(eventObjectReplay).toContain("DOMAIN_PAIR_NOT_ALLOWED");
    expect(eventObjectReplay).toContain("INTEREST_RECIPIENT_REQUIRED");
    expect(eventObjectReplay).toContain("Conversation access denied");
    expect(eventObjectReplay).toContain(
      "Domain completion prerequisites are not satisfied",
    );
    expect(eventObjectReplay).toContain(
      "SWAPLY-V156-PRIVATE-EVENT-CODE",
    );
  });

  it("does not bypass canonical matching, agreement, Exchange or Event ledgers", () => {
    const forbiddenFixtureWrites = [
      /insert\s+into\s+public\.matching_interests/i,
      /insert\s+into\s+public\.matches/i,
      /insert\s+into\s+public\.conversations/i,
      /insert\s+into\s+public\.swaps/i,
      /insert\s+into\s+public\.event_transfers/i,
      /insert\s+into\s+public\.event_proofs/i,
      /insert\s+into\s+public\.event_transfer_events/i,
      /insert\s+into\s+public\.swap_completion_confirmations/i,
    ];

    for (const pattern of forbiddenFixtureWrites) {
      expect(eventObjectReplay).not.toMatch(pattern);
    }

    expect(eventObjectReplay.trim().toLowerCase()).not.toContain("commit;");
    expect(eventObjectReplay).toContain("rollback;");
    expect(eventObjectReplay).toContain("'rollback', true");
  });

  it("keeps the public browser proof explicit and separate from authenticated authority", () => {
    for (const domain of ["properties", "services", "events"]) {
      expect(browserJourney).toContain(
        `{ key: "${domain}", route: "/en/${domain}"`,
      );
      expect(browserJourney).toContain(
        `[data-drawer-page="${"${domain.key}"}"]`,
      );
    }

    expect(browserJourney).toContain(
      'a[href*="/en/register?returnTo=${domain.createPath}"]',
    );
    expect(browserJourney).toContain('input[type="text"]');
    expect(browserJourney).toContain("context menu");
    expect(browserJourney).toContain("desktop");
    expect(browserJourney).toContain("mobile");
    expect(workflow).toContain("e2e/public-visual-audit.spec.ts");
    expect(workflow).toContain("e2e/i18n-43-locales.spec.ts");
    expect(workflow).toContain(
      "e2e/v1-05-6-domain-cumulative.spec.ts",
    );
  });

  it("archives browser and rollback-only database evidence", () => {
    expect(workflow).toContain("actions/upload-artifact@v4");
    expect(workflow).toContain("playwright-v1-05-6-screenshots");
    expect(workflow).toContain("v1-05-6-event-object-e2e.log");
    expect(workflow).toContain(
      "V1-05.6 rollback cleanup left deterministic fixture data.",
    );
    expect(workflow).toContain("supabase stop --no-backup");
  });
});
