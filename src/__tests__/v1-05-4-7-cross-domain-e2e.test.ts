import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(
    process.cwd(),
    ".github/workflows/v1-05-4-7-cross-domain-e2e.yml",
  ),
  "utf8",
);

const matchingHardening = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260803074500_v1_05_4_7_matching_interest_ambiguity_hardening.sql",
  ),
  "utf8",
);

const fixture = readFileSync(
  resolve(
    process.cwd(),
    "supabase/tests/fixtures/v1_05_4_7_cross_domain_e2e_fixture.sql",
  ),
  "utf8",
);

const replay = readFileSync(
  resolve(
    process.cwd(),
    "supabase/tests/v1_05_4_7_cross_domain_e2e_replay.sql",
  ),
  "utf8",
);

const contract = readFileSync(
  resolve(
    process.cwd(),
    "supabase/tests/v1_05_4_7_cross_domain_e2e_contract.sql",
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

describe("V1-05.4.7 cross-domain E2E", () => {
  it("compiles the exact matching-to-completion authority chain", () => {
    for (const migration of [
      "20260801163000_v1_05_4_1_canonical_cross_domain_matching.sql",
      "20260802100000_v1_05_4_2_domain_aware_agreement.sql",
      "20260802101500_v1_05_4_2_domain_exchange_handoff.sql",
      "20260802170000_v1_05_4_3_property_reservation_authority.sql",
      "20260802190000_v1_05_4_4_service_delivery_authority.sql",
      "20260803001000_v1_05_4_5_event_transfer_authority.sql",
      "20260803030000_v1_05_4_5_event_transfer_hardening.sql",
      "20260803030500_v1_05_4_5_event_completion_guard_contract.sql",
      "20260803043000_v1_05_4_6_domain_aware_exchange_completion.sql",
      "20260803054500_v1_05_4_6_1_completion_readiness_hardening.sql",
      "20260803074500_v1_05_4_7_matching_interest_ambiguity_hardening.sql",
    ]) {
      expect(workflow).toContain(migration);
    }

    expect(workflow).toContain(
      "v1_05_4_7_cross_domain_e2e_fixture.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_7_cross_domain_e2e_contract.sql",
    );
    expect(workflow).toContain(
      "v1_05_4_7_cross_domain_e2e_replay.sql",
    );
  });

  it("hardens the runtime Matching interest conflict without changing the RPC shape", () => {
    expect(matchingHardening).toContain(
      "create or replace function public.express_matching_interest",
    );
    expect(matchingHardening).toContain("#variable_conflict use_column");
    expect(matchingHardening).toContain(
      "on conflict (from_user_id, from_item_id, to_user_id, to_item_id)",
    );
    expect(matchingHardening).toContain(
      "where status in ('pending', 'accepted')",
    );
    expect(matchingHardening).toContain(
      "grant execute on function public.express_matching_interest",
    );
    expect(governance.forward_migrations).toContainEqual(
      expect.objectContaining({
        path: "supabase/migrations/20260803074500_v1_05_4_7_matching_interest_ambiguity_hardening.sql",
        name: "v1_05_4_7_matching_interest_ambiguity_hardening",
      }),
    );
  });

  it("traverses canonical Matching, Chat, Agreement, Exchange and completion authorities", () => {
    for (const authority of [
      "public.express_matching_interest",
      "public.accept_matching_interest",
      "public.update_match_conversation_agreement_v2",
      "public.create_exchange_from_match_agreement",
      "public.mutate_service_delivery_v1",
      "public.get_domain_completion_readiness_v1",
      "public.confirm_swap_completion_v1",
    ]) {
      expect(replay).toContain(authority);
      expect(contract).toContain(authority);
    }

    expect(replay).toContain("insert into public.messages");
    expect(replay).toContain("chat_participant_only");
  });

  it("does not bypass the canonical Match, Agreement, Exchange or domain ledgers", () => {
    for (const forbiddenInsert of [
      "insert into public.matching_interests",
      "insert into public.matches",
      "insert into public.conversations",
      "insert into public.swaps",
      "insert into public.match_agreement_mutation_receipts",
      "insert into public.property_reservations",
      "insert into public.service_deliveries",
      "insert into public.service_delivery_milestones",
      "insert into public.swap_completion_confirmations",
      "insert into public.swap_completion_effects",
      "insert into public.swap_post_completion_effects",
    ]) {
      expect(replay.toLowerCase()).not.toContain(forbiddenInsert);
    }
  });

  it("proves replay, stale revision, outsider denial and premature completion denial", () => {
    expect(replay).toContain("DOMAIN_PAIR_NOT_ALLOWED");
    expect(replay).toContain("INTEREST_RECIPIENT_REQUIRED");
    expect(replay).toContain("Agreement revision conflict");
    expect(replay).toContain("idempotency key");
    expect(replay).toContain("row-level security");
    expect(replay).toContain(
      "Domain completion prerequisites are not satisfied",
    );
    expect(replay).toContain("premature_completion_denied");
    expect(replay).toContain("reusable_listings_preserved");
  });

  it("models participant-only chat without weakening domain ledgers", () => {
    expect(fixture).toContain("v1547_messages_participant_insert");
    expect(fixture).toContain("sender_id = auth.uid()");
    expect(fixture).toContain("match_row.status = 'accepted'");
    expect(fixture).toContain("cardinality(conversation_row.participant_ids) = 2");
    expect(contract).toContain("direct_ledger_writes");
    expect(contract).toContain("DENIED");
  });

  it("runs rollback-only and verifies strict deterministic cleanup", () => {
    expect(replay).toContain("rollback;");
    expect(replay).toContain("'rollback', true");
    expect(workflow).toContain(
      "raise exception 'V1-05.4.7 rollback cleanup left deterministic fixture data.';",
    );
    expect(workflow).toContain("id::text like 'a5470000-%'");
    expect(workflow).toContain("'v1_05_4_7_cleanup', 'PASS'");
    expect(workflow).toMatch(/uses:\s+actions\/upload-artifact@/);
  });
});