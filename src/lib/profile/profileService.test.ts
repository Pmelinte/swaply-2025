import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  isProfileConflict,
  ProfileServiceError,
  updateOwnGlobalProfile,
} from "./profileService";

describe("Batch 65 revisioned profile service", () => {
  it("calls only the canonical RPC with revision, payload and idempotency key", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        replayed: false,
        profile_revision: 8,
        profile: {
          user_id: "28ed0e64-16c6-4552-899e-160339a9acaa",
          profile_revision: 8,
          primary_language: "ro",
          secondary_language: "fr",
          tertiary_language: null,
          user_type: "individual",
          availability_status: "available",
          timezone: "Europe/Bucharest",
        },
      },
      error: null,
    });
    const client = { rpc } as unknown as SupabaseClient;

    const result = await updateOwnGlobalProfile(client, {
      expectedRevision: 7,
      idempotencyKey: "profile:test-update-1",
      payload: {
        primary_language: "ro",
        secondary_language: "fr",
      },
      routeLocale: "en",
    });

    expect(rpc).toHaveBeenCalledWith("update_own_profile_v1", {
      p_expected_revision: 7,
      p_payload: {
        primary_language: "ro",
        secondary_language: "fr",
      },
      p_idempotency_key: "profile:test-update-1",
    });
    expect(result.replayed).toBe(false);
    expect(result.profileRevision).toBe(8);
    expect(result.contract.revision).toBe(8);
    expect(result.contract.languagePreferences.primary).toBe("ro");
  });

  it("preserves idempotent replay state returned by the server", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: {
          replayed: true,
          profile_revision: 3,
          profile: {
            user_id: "222d9e9d-993f-4e37-be6f-a60c9d335c31",
            profile_revision: 3,
            primary_language: "de",
          },
        },
        error: null,
      }),
    } as unknown as SupabaseClient;

    const result = await updateOwnGlobalProfile(client, {
      expectedRevision: 2,
      idempotencyKey: "profile:replay-123",
      payload: { primary_language: "de" },
    });

    expect(result.replayed).toBe(true);
    expect(result.profileRevision).toBe(3);
  });

  it("classifies stale revision errors as conflicts", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Stale profile revision: expected 2, current 3",
          code: "40001",
          details: "",
          hint: "",
        },
      }),
    } as unknown as SupabaseClient;

    await expect(updateOwnGlobalProfile(client, {
      expectedRevision: 2,
      idempotencyKey: "profile:stale-123",
      payload: { availability_status: "away" },
    })).rejects.toMatchObject({
      name: "ProfileServiceError",
      code: "40001",
      isStaleRevision: true,
      isConflict: true,
    });

    try {
      await updateOwnGlobalProfile(client, {
        expectedRevision: 2,
        idempotencyKey: "profile:stale-456",
        payload: { availability_status: "away" },
      });
    } catch (error) {
      expect(isProfileConflict(error)).toBe(true);
    }
  });

  it("rejects invalid client inputs before calling Supabase", async () => {
    const rpc = vi.fn();
    const client = { rpc } as unknown as SupabaseClient;

    await expect(updateOwnGlobalProfile(client, {
      expectedRevision: 0,
      idempotencyKey: "profile:invalid-revision",
      payload: {},
    })).rejects.toBeInstanceOf(ProfileServiceError);

    await expect(updateOwnGlobalProfile(client, {
      expectedRevision: 1,
      idempotencyKey: "short",
      payload: {},
    })).rejects.toMatchObject({ code: "INVALID_PROFILE_IDEMPOTENCY_KEY" });

    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects malformed server responses rather than accepting partial profile state", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({
        data: { replayed: false, profile_revision: "2" },
        error: null,
      }),
    } as unknown as SupabaseClient;

    await expect(updateOwnGlobalProfile(client, {
      expectedRevision: 1,
      idempotencyKey: "profile:invalid-response",
      payload: { primary_language: "ro" },
    })).rejects.toMatchObject({ code: "INVALID_PROFILE_RESPONSE" });
  });
});
