import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("src/app/api/swaps/[id]/logistics/route.ts", "utf8");
const persistence = readFileSync(
  "src/lib/exchange/exchangeLogisticsPersistence.ts",
  "utf8",
);
const migration = readFileSync(
  "supabase/migrations/20260731030000_v1_04_2b3_exchange_logistics_authority.sql",
  "utf8",
);

describe("Prompts 76-80 exchange logistics authority", () => {
  it("derives logistics actor authority from the authenticated server session", () => {
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("actorId: user.id");
    expect(route).not.toMatch(/actorId:\s*body\./);
    expect(route).not.toMatch(/userId:\s*body\./);
  });

  it("keeps each logistics operation participant-only inside the canonical RPC", () => {
    expect(persistence).toContain('supabase.rpc("update_exchange_logistics_v1"');
    expect(persistence).not.toContain('from("swaps").update');
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain("FOR UPDATE");
    expect(migration).toContain(
      "v_actor_id <> v_swap.requester_id AND v_actor_id <> v_swap.responder_id",
    );

    for (const command of [
      "set_method",
      "set_status",
      "set_local_handover",
      "set_courier",
      "set_property",
      "set_service",
      "set_event",
    ]) {
      expect(migration).toContain(command);
    }
  });

  it("persists bilateral completion through the canonical RPC only", () => {
    const completion = readFileSync("src/lib/swaps/swapCompletion.ts", "utf8");
    expect(completion).toContain("confirm_swap_completion_v1");
    expect(completion).toContain("p_idempotency_key");
  });
});
