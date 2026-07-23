import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const route = readFileSync("src/app/api/swaps/[id]/logistics/route.ts", "utf8");
const persistence = readFileSync(
  "src/lib/exchange/exchangeLogisticsPersistence.ts",
  "utf8",
);

describe("Prompts 76-80 exchange logistics authority", () => {
  it("derives logistics actor authority from the authenticated server session", () => {
    expect(route).toContain("supabase.auth.getUser()");
    expect(route).toContain("actorId: user.id");
    expect(route).not.toMatch(/actorId:\s*body\./);
    expect(route).not.toMatch(/userId:\s*body\./);
  });

  it("keeps each logistics operation participant-only before writes", () => {
    expect(persistence).toContain("loadParticipantSwap");
    expect(persistence).toContain(
      "actorId !== row.requester_id && actorId !== row.responder_id",
    );
    for (const fn of [
      "setCourierLogistics",
      "setPropertyLogistics",
      "setServiceLogistics",
      "setEventLogistics",
    ]) {
      expect(persistence).toContain(`export async function ${fn}`);
      expect(persistence).toContain("const row = await loadParticipantSwap");
    }
  });

  it("persists bilateral completion through the canonical RPC only", () => {
    const completion = readFileSync("src/lib/swaps/swapCompletion.ts", "utf8");
    expect(completion).toContain("confirm_swap_completion_v1");
    expect(completion).toContain("p_idempotency_key");
  });
});
