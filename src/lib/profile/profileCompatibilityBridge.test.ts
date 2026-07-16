import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  ensureOwnProfileWithCompatibility,
  isMissingProfileRpcError,
  ProfileCompatibilityBridgeError,
  updateOwnProfileWithCompatibility,
} from "./profileCompatibilityBridge";

function makeLegacyClient(options: {
  rpcData?: unknown;
  rpcError?: Record<string, unknown> | null;
  legacyData?: Record<string, unknown> | null;
  legacyError?: Record<string, unknown> | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: options.legacyData ?? null,
    error: options.legacyError ?? null,
  });
  const select = vi.fn().mockReturnValue({ maybeSingle });
  const upsert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ upsert });
  const rpc = vi.fn().mockResolvedValue({
    data: options.rpcData ?? null,
    error: options.rpcError ?? null,
  });

  return {
    client: { rpc, from } as unknown as SupabaseClient,
    rpc,
    from,
    upsert,
  };
}

describe("Batch 65.2 profile compatibility bridge", () => {
  it("uses ensure_own_profile_v1 when the RPC exists", async () => {
    const { client, rpc, from } = makeLegacyClient({
      rpcData: {
        created: true,
        profile_revision: 1,
        profile: { user_id: "u1", display_name: "Petru", profile_revision: 1 },
      },
    });

    const result = await ensureOwnProfileWithCompatibility(client, {
      routeLocale: "ro",
      legacyPayload: { user_id: "u1", display_name: "legacy" },
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

  it("falls back to the legacy bootstrap only when ensure RPC is missing", async () => {
    const { client, from, upsert } = makeLegacyClient({
      rpcError: {
        code: "PGRST202",
        message: "Could not find the function public.ensure_own_profile_v1(p_route_locale) in the schema cache",
      },
      legacyData: { user_id: "u1", display_name: "legacy" },
    });

    const legacyPayload = { user_id: "u1", display_name: "legacy" };
    const result = await ensureOwnProfileWithCompatibility(client, {
      routeLocale: "ro",
      legacyPayload,
    });

    expect(from).toHaveBeenCalledWith("profiles");
    expect(upsert).toHaveBeenCalledWith(legacyPayload, { onConflict: "user_id" });
    expect(result.mode).toBe("legacy");
    expect(result.profileRevision).toBe(1);
  });

  it("does not bootstrap through legacy SQL for permission or RLS errors", async () => {
    const { client, from } = makeLegacyClient({
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
    const { client, rpc, from } = makeLegacyClient({
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
      legacyPayload: { user_id: "u1", display_name: "Updated" },
    });

    expect(rpc).toHaveBeenCalledWith("update_own_profile_v1", {
      p_expected_revision: 3,
      p_payload: { display_name: "Updated" },
      p_idempotency_key: "profile-bridge-test-0001",
    });
    expect(from).not.toHaveBeenCalled();
    expect(result).toMatchObject({ mode: "rpc", profileRevision: 4, replayed: false });
  });

  it("falls back to the legacy owner upsert only when update RPC is missing", async () => {
    const { client, upsert } = makeLegacyClient({
      rpcError: {
        code: "42883",
        message: "function public.update_own_profile_v1(bigint, jsonb, text) does not exist",
      },
      legacyData: { user_id: "u1", display_name: "Legacy save" },
    });

    const legacyPayload = { user_id: "u1", display_name: "Legacy save" };
    const result = await updateOwnProfileWithCompatibility(client, {
      expectedRevision: 1,
      canonicalPayload: { display_name: "Legacy save" },
      legacyPayload,
    });

    expect(upsert).toHaveBeenCalledWith(legacyPayload, { onConflict: "user_id" });
    expect(result.mode).toBe("legacy");
  });

  it("never falls back for stale revision, validation or security errors", async () => {
    for (const error of [
      { code: "40001", message: "Stale profile revision" },
      { code: "22023", message: "Unsupported profile fields" },
      { code: "42501", message: "Profile update denied" },
    ]) {
      const { client, from } = makeLegacyClient({ rpcError: error });

      await expect(updateOwnProfileWithCompatibility(client, {
        expectedRevision: 1,
        canonicalPayload: { display_name: "No fallback" },
        legacyPayload: { user_id: "u1", display_name: "No fallback" },
      })).rejects.toBeInstanceOf(ProfileCompatibilityBridgeError);

      expect(from).not.toHaveBeenCalled();
    }
  });

  it("does not hide a malformed successful RPC response behind legacy fallback", async () => {
    const { client, from } = makeLegacyClient({
      rpcData: { profile_revision: 2 },
    });

    await expect(updateOwnProfileWithCompatibility(client, {
      expectedRevision: 1,
      canonicalPayload: { display_name: "Malformed" },
      legacyPayload: { user_id: "u1", display_name: "Malformed" },
    })).rejects.toMatchObject({ code: "INVALID_PROFILE_RPC_RESPONSE" });

    expect(from).not.toHaveBeenCalled();
  });

  it("recognizes only function-specific missing-RPC errors", () => {
    expect(isMissingProfileRpcError({
      code: "PGRST202",
      message: "Could not find the function public.update_own_profile_v1 in the schema cache",
    }, "update_own_profile_v1")).toBe(true);

    expect(isMissingProfileRpcError({
      code: "PGRST202",
      message: "Could not find another function in the schema cache",
    }, "update_own_profile_v1")).toBe(false);
  });
});
