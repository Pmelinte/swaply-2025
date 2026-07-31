import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260731040000_v1_04_2b5_final_grants_rls_hardening.sql",
  "utf8",
).toLowerCase();
const serviceInterestRoute = readFileSync(
  "src/app/api/items/services/[id]/interest/route.ts",
  "utf8",
);

describe("V1-04 final grants and RLS hardening", () => {
  it("routes the remaining service interest write through canonical authority", () => {
    expect(serviceInterestRoute).toContain(
      'supabase.rpc("express_matching_interest"',
    );
    expect(serviceInterestRoute).not.toContain(
      '.from("matching_interests")\n    .insert',
    );
  });

  it("removes direct writes from canonical authority tables", () => {
    for (const table of [
      "matching_interests",
      "matches",
      "conversations",
      "swaps",
    ]) {
      expect(migration).toContain(
        `revoke insert, update, delete on table public.${table}`,
      );
    }
  });

  it("keeps messages append-only with operational updates and no deletion", () => {
    expect(migration).toContain(
      "revoke delete on table public.messages",
    );
    expect(migration).toContain(
      "grant select, insert, update on table public.messages to authenticated",
    );
    expect(migration).toContain("messages_update_operational_v1");
    expect(migration).toContain("auth.uid() = sender_id");
    expect(migration).toContain("auth.uid() = recipient_id");
  });

  it("exposes the canonical RPC surface explicitly", () => {
    for (const rpc of [
      "express_matching_interest",
      "accept_matching_interest",
      "withdraw_matching_interest_v1",
      "update_match_conversation_agenda",
      "update_match_conversation_agreement",
      "create_exchange_from_match_agreement",
      "transition_swap_v1",
      "cancel_swap_v1",
      "confirm_swap_completion_v1",
      "open_swap_dispute_v1",
      "submit_swap_review_v1",
      "update_exchange_logistics_v1",
    ]) {
      expect(migration).toContain(`public.${rpc}`);
    }
  });
});
