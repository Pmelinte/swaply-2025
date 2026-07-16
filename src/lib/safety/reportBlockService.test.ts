import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  resolveSafetyReport,
  setUserBlock,
  submitSafetyReport,
} from "./reportBlockService";

function clientWithRpc(data: unknown, error: unknown = null) {
  const rpc = vi.fn().mockResolvedValue({ data, error });
  return {
    client: { rpc } as unknown as SupabaseClient,
    rpc,
  };
}

describe("Batch 63.3 safety RPC adapters", () => {
  it("serializes canonical report evidence", async () => {
    const { client, rpc } = clientWithRpc({
      report: { id: "report-1", status: "open" },
      replayed: false,
      idempotency_key: "report:key-1",
    });

    const result = await submitSafetyReport(client, {
      targetType: "item",
      targetId: "00000000-0000-4000-8000-000000000001",
      reason: "scam",
      description: "  suspicious listing  ",
      evidence: [{ evidenceType: "note", content: "  repeated request  " }],
      idempotencyKey: "report:key-1",
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("submit_safety_report_v1", {
      p_target_type: "item",
      p_target_id: "00000000-0000-4000-8000-000000000001",
      p_reason: "scam",
      p_description: "suspicious listing",
      p_evidence: [{ evidence_type: "note", content: "repeated request" }],
      p_idempotency_key: "report:key-1",
    });
  });

  it("rejects malformed block responses", async () => {
    const { client } = clientWithRpc({
      target_user_id: "wrong-user",
      blocked: true,
      block: null,
      refused_interest_count: 0,
      replayed: false,
      idempotency_key: "block:key-1",
    });

    const result = await setUserBlock(client, {
      targetUserId: "00000000-0000-4000-8000-000000000002",
      blocked: true,
      idempotencyKey: "block:key-1",
    });

    expect(result).toEqual({
      ok: false,
      error: {
        code: undefined,
        message: "Invalid block response",
        details: undefined,
      },
    });
  });

  it("passes expected status and action to canonical resolution", async () => {
    const { client, rpc } = clientWithRpc({
      report: { id: "report-2", status: "resolved" },
      replayed: false,
      idempotency_key: "resolve:key-1",
      effect_applied: true,
      report_counted: true,
      affected_user_id: "00000000-0000-4000-8000-000000000003",
      affected_item_id: null,
    });

    const result = await resolveSafetyReport(client, {
      reportId: "00000000-0000-4000-8000-000000000004",
      expectedStatus: "investigating",
      action: "warn",
      notes: "  confirmed harassment  ",
      idempotencyKey: "resolve:key-1",
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("resolve_safety_report_v1", {
      p_report_id: "00000000-0000-4000-8000-000000000004",
      p_expected_status: "investigating",
      p_action: "warn",
      p_notes: "confirmed harassment",
      p_idempotency_key: "resolve:key-1",
    });
  });
});
