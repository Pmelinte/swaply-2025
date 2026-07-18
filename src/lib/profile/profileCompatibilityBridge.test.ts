import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  ensureOwnProfileWithCompatibility,
  isMissingProfileRpcError,
  ProfileCompatibilityBridgeError,
  updateOwnProfileWithCompatibility,
} from "./profileCompatibilityBridge";

function makeRpcClient(options: {
  rpcData?: unknown;
  rpcError?: Record<string, unknown> | null;
}) {
  const from = vi.fn();
  const rpc = vi.fn().mockResolvedValue({
    data: options.rpcData ?? null,
    error: options.rpcError ?? null,
  });

  return {
    client: { rpc, from } as unknown as SupabaseClient,
    rpc,
    from,
  };
}

const missingEnsureRpc = {
  code: "PGRST202",
  message: "Could not find the function public.ensure_own_profile_v1(p_route_locale) in the schema cache",
};

const missingUpdateRpc = {
  code: "42883",
  message: "function public.update_own_profile_v1(bigint, jsonb, text) does not exist",
};

describe("Batch 65.5 strict profile RPC authority", () => {
  it("uses ensure_own_profile_v1 as the only bootstrap authority", async () => {
    const { client, rpc, from } = makeRpcClient({
      rpcData: {
        created: true,
        profile_revision: 1,
        profile: { user_id: "u1", display_name: "Petru", profile_revision: 1 },
      },
    });

    const result = await ensureOwnProfileWithCompatibility(client, {
      routeLocale: "ro",
      legacyPayload: { user_id: "u1", display_name: "unused" },
    });

    expect(rpc).toHaveBeenCalledWith("ensure_own_profile_v1", {
      p_route_locale: "ro",
    });
    expect(from).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      mode: "rpc",
      profileRevision: 1,
      profileRow: { user_id: "u1", display_name: "Petru" },
    });
  });

  it("treats a missing ensure RPC as a hard rollout error", async () => {
    const { client, from } = makeRpcClient({ rpcError: missingEnsureRpc });

    await expect(ensureOwnProfileWithCompatibility(client, {
      routeLocale: "ro",
      legacyPayload: { user_id: "u1", display_name: "must-not-write" },
    })).rejects.toMatchObject({ code: "PGRST202" });

    expect(from).not.toHaveBeenCalled();
  });

  it("does not hide permission or RLS errors behind a browser write", async () => {
    const { client, from } = makeRpcClient({
      rpcError: {
        code: "42501",
        message: "permission denied for function ensure_own_profile_v1",
      },
    });

    await expect(ensureOwnProfileWithCompatibility(client, {
      routeLocale: "ro",
      legacyPayload: { user_id: "u1" },
    })).rejects.toMatchObject({ code: "42501" });

    expect(from).not.toHaveBeenCalled();
  });

  it("uses update_own_profile_v1 with revision and idempotency key", async () => {
    const { client, rpc, from } = makeRpcClient({
      rpcData: {
        replayed: false,
        profile_revision: 4,
        profile: { user_id: "u1", display_name: "Updated", profile_revision: 4 },
      },
    });

    const result = await updateOwnProfileWithCompatibility(client, {
      expectedRevision: 3,
      idempotencyKey: "profile-bridge-test-0001",
      canonicalPayload: { display_name: "Updated" },
      legacyPayload: { user_id: "u1", display_name: "unused" },
    });

    expect(rpc).toHaveBeenCalledWith("update_own_profile_v1", {
      p_expected_revision: 3,
      p_payload: { display_name: "Updated" },
      p_idempotency_key: "profile-bridge-test-0001",
    });
    expect(from).not.toHaveBeenCalled();
    expect(result).toMatchObject({ mode: "rpc", profileRevision: 4, replayed: false });
  });

  it("treats a missing update RPC as a hard rollout error", async () => {
    const { client, from } = makeRpcClient({ rpcError: missingUpdateRpc });

    await expect(updateOwnProfileWithCompatibility(client, {
      expectedRevision: 1,
      canonicalPayload: { display_name: "No fallback" },
      legacyPayload: { user_id: "u1", display_name: "must-not-write" },
    })).rejects.toMatchObject({ code: "42883" });

    expect(from).not.toHaveBeenCalled();
  });

  it("propagates stale revision, validation and security errors", async () => {
    for (const error of [
      { code: "40001", message: "Stale profile revision" },
      { code: "22023", message: "Unsupported profile fields" },
      { code: "42501", message: "Profile update denied" },
    ]) {
      const { client, from } = makeRpcClient({ rpcError: error });

      await expect(updateOwnProfileWithCompatibility(client, {
        expectedRevision: 1,
        canonicalPayload: { display_name: "No fallback" },
        legacyPayload: { user_id: "u1", display_name: "must-not-write" },
      })).rejects.toBeInstanceOf(ProfileCompatibilityBridgeError);

      expect(from).not.toHaveBeenCalled();
    }
  });

  it("rejects an invalid expected revision before making a request", async () => {
    const { client, rpc } = makeRpcClient({});

    await expect(updateOwnProfileWithCompatibility(client, {
      expectedRevision: 0,
      canonicalPayload: { display_name: "Invalid" },
      legacyPayload: { user_id: "u1" },
    })).rejects.toMatchObject({ code: "INVALID_PROFILE_REVISION" });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects an RPC response that omits the revision", async () => {
    const { client, from } = makeRpcClient({
      rpcData: {
        profile: { user_id: "u1", display_name: "Missing revision" },
      },
    });

    await expect(updateOwnProfileWithCompatibility(client, {
      expectedRevision: 1,
      canonicalPayload: { display_name: "Missing revision" },
      legacyPayload: { user_id: "u1" },
    })).rejects.toMatchObject({ code: "INVALID_PROFILE_RPC_RESPONSE" });

    expect(from).not.toHaveBeenCalled();
  });

  it("rejects invalid or contradictory RPC revisions", async () => {
    for (const rpcData of [
      {
        profile_revision: 0,
        profile: { user_id: "u1", profile_revision: 0 },
      },
      {
        profile_revision: 3,
        profile: { user_id: "u1", profile_revision: 4 },
      },
    ]) {
      const { client, from } = makeRpcClient({ rpcData });

      await expect(updateOwnProfileWithCompatibility(client, {
        expectedRevision: 2,
        canonicalPayload: { display_name: "Invalid revision" },
        legacyPayload: { user_id: "u1" },
      })).rejects.toMatchObject({ code: "INVALID_PROFILE_RPC_RESPONSE" });

      expect(from).not.toHaveBeenCalled();
    }
  });

  it("recognizes only coded, function-specific missing-RPC errors", () => {
    expect(isMissingProfileRpcError({
      code: "PGRST202",
      message: "Could not find the function public.update_own_profile_v1 in the schema cache",
    }, "update_own_profile_v1")).toBe(true);

    expect(isMissingProfileRpcError({
      code: "PGRST202",
      message: "Could not find another function in the schema cache",
    }, "update_own_profile_v1")).toBe(false);

    expect(isMissingProfileRpcError({
      message: "function public.update_own_profile_v1 does not exist",
    }, "update_own_profile_v1")).toBe(false);

    expect(isMissingProfileRpcError({
      code: "42501",
      message: "function public.update_own_profile_v1 does not exist",
    }, "update_own_profile_v1")).toBe(false);
  });
});
