import { describe, expect, it, vi } from "vitest";
import { persistExpressedInterest } from "@/lib/matching/interestPersistence";

function rpcClient(result: unknown, error: unknown = null) {
  return {
    rpc: vi.fn(() => ({
      single: vi.fn(async () => ({ data: result, error })),
    })),
  } as unknown as Parameters<typeof persistExpressedInterest>[0];
}

const sourceItem = {
  id: "source-item",
  owner_id: "actor-user",
  title: "Camera",
  category: "objects",
  item_type: "object",
  perceived_value_tier: "medium",
  swap_wants_category_l1: null,
  swap_open_to: null,
  images: [],
  image_url: null,
  photos: [],
  estimated_value: null,
  created_at: null,
};

const targetItem = {
  ...sourceItem,
  id: "target-item",
  owner_id: "target-user",
  title: "Tripod",
};

describe("persistExpressedInterest", () => {
  it("uses the canonical RPC without sending client-controlled owners or status", async () => {
    const client = rpcClient({
      id: "interest-id",
      to_user_id: "target-user",
      to_item_id: "target-item",
      match_score: 88,
      status: "pending",
    });

    const result = await persistExpressedInterest(client, {
      userId: "actor-user",
      sourceItem,
      candidate: { item: targetItem, score: 88 },
      source: "browsing",
    });

    expect(result?.id).toBe("interest-id");
    expect(client.rpc).toHaveBeenCalledWith("express_matching_interest", {
      p_from_item_id: "source-item",
      p_to_item_id: "target-item",
      p_match_score: 88,
      p_source: "browsing",
    });
  });

  it("refuses self-interest before persistence", async () => {
    const client = rpcClient(null);
    const result = await persistExpressedInterest(client, {
      userId: "actor-user",
      sourceItem,
      candidate: { item: { ...targetItem, owner_id: "actor-user" }, score: 50 },
    });

    expect(result).toBeNull();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it("returns null when the server rejects the RPC", async () => {
    const client = rpcClient(null, { message: "SOURCE_ITEM_OWNER_REQUIRED" });
    const result = await persistExpressedInterest(client, {
      userId: "actor-user",
      sourceItem,
      candidate: { item: targetItem, score: 50 },
    });

    expect(result).toBeNull();
  });
});
