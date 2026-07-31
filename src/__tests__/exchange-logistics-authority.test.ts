import { describe, expect, it, vi } from "vitest";
import { setExchangeMethod } from "@/lib/exchange/exchangeLogisticsPersistence";

describe("exchange logistics authority", () => {
  it("sends only immutable swap identity, command and payload to the canonical RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        swap_id: "swap-1",
        method: "local_meetup",
        status: "planning",
        timeline: [],
      },
      error: null,
    });
    const from = vi.fn(() => {
      throw new Error("direct table writes are not allowed");
    });

    const result = await setExchangeMethod(
      { rpc, from } as never,
      {
        swapId: "swap-1",
        actorId: "client-supplied-actor-must-not-be-sent",
        method: "local_meetup",
      },
    );

    expect(rpc).toHaveBeenCalledWith("update_exchange_logistics_v1", {
      p_swap_id: "swap-1",
      p_command: "set_method",
      p_payload: { method: "local_meetup" },
    });
    expect(from).not.toHaveBeenCalled();
    expect(result?.method).toBe("local_meetup");
  });
});
