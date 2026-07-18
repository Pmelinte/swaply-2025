import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  OnboardingProfileAuthorityError,
  sanitizeOnboardingProfilePayload,
  updateOnboardingProfileWithAuthority,
} from "./onboardingProfileAuthority";

type MockResult = {
  data?: unknown;
  error?: Record<string, unknown> | null;
};

function makeClient(options: {
  profileReads: MockResult[];
  rpcResults: MockResult[];
}) {
  const profileReadQueue = [...options.profileReads];
  const rpcQueue = [...options.rpcResults];
  const single = vi.fn().mockImplementation(async () => {
    const next = profileReadQueue.shift() ?? { data: null, error: null };
    return {
      data: next.data ?? null,
      error: next.error ?? null,
    };
  });
  const eq = vi.fn().mockReturnValue({ single });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  const rpc = vi.fn().mockImplementation(async () => {
    const next = rpcQueue.shift() ?? { data: null, error: null };
    return {
      data: next.data ?? null,
      error: next.error ?? null,
    };
  });

  return {
    client: { from, rpc } as unknown as SupabaseClient,
    from,
    rpc,
    single,
  };
}

describe("Batch 65.6 onboarding profile authority", () => {
  it("accepts only onboarding-owned profile fields", () => {
    expect(sanitizeOnboardingProfilePayload({
      display_name: "Petru",
      languages: ["ro", "fr", "it"],
      onboarding_completed: true,
    })).toEqual({
      display_name: "Petru",
      languages: ["ro", "fr", "it"],
      onboarding_completed: true,
    });

    expect(() => sanitizeOnboardingProfilePayload({ trust_score: 999 }))
      .toThrowError(OnboardingProfileAuthorityError);
  });

  it("writes through update_own_profile_v1 with the current revision", async () => {
    const { client, rpc } = makeClient({
      profileReads: [{ data: { profile_revision: 3 } }],
      rpcResults: [{
        data: {
          profile_revision: 4,
          profile: { user_id: "user-1", display_name: "Petru" },
        },
      }],
    });

    const result = await updateOnboardingProfileWithAuthority({
      supabase: client,
      userId: "user-1",
      payload: { display_name: "Petru" },
      idempotencyPrefix: "onboarding-step-user-1-request-1",
    });

    expect(rpc).toHaveBeenCalledWith("update_own_profile_v1", {
      p_expected_revision: 3,
      p_payload: { display_name: "Petru" },
      p_idempotency_key: "onboarding-step-user-1-request-1:3",
    });
    expect(result.profileRevision).toBe(4);
  });

  it("bootstraps a missing profile through ensure_own_profile_v1 before writing", async () => {
    const { client, rpc, single } = makeClient({
      profileReads: [
        {
          error: {
            code: "PGRST116",
            message: "JSON object requested, multiple (or no) rows returned",
          },
        },
        { data: { profile_revision: 1 } },
      ],
      rpcResults: [
        { data: { profile_revision: 1 } },
        {
          data: {
            profile_revision: 2,
            profile: { user_id: "user-1", display_name: "New user" },
          },
        },
      ],
    });

    const result = await updateOnboardingProfileWithAuthority({
      supabase: client,
      userId: "user-1",
      payload: { display_name: "New user" },
      idempotencyPrefix: "onboarding-step-user-1-bootstrap",
    });

    expect(single).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(1, "ensure_own_profile_v1", {
      p_requested_locale: null,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "update_own_profile_v1", {
      p_expected_revision: 1,
      p_payload: { display_name: "New user" },
      p_idempotency_key: "onboarding-step-user-1-bootstrap:1",
    });
    expect(result.profileRevision).toBe(2);
  });

  it("re-reads the revision and retries once after a stale write", async () => {
    const { client, rpc, single } = makeClient({
      profileReads: [
        { data: { profile_revision: 3 } },
        { data: { profile_revision: 4 } },
      ],
      rpcResults: [
        { error: { code: "40001", message: "Stale profile revision" } },
        {
          data: {
            profile_revision: 5,
            profile: { user_id: "user-1", display_name: "Updated" },
          },
        },
      ],
    });

    const result = await updateOnboardingProfileWithAuthority({
      supabase: client,
      userId: "user-1",
      payload: { display_name: "Updated" },
      idempotencyPrefix: "onboarding-step-user-1-request-2",
    });

    expect(single).toHaveBeenCalledTimes(2);
    expect(rpc).toHaveBeenNthCalledWith(1, "update_own_profile_v1", {
      p_expected_revision: 3,
      p_payload: { display_name: "Updated" },
      p_idempotency_key: "onboarding-step-user-1-request-2:3",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "update_own_profile_v1", {
      p_expected_revision: 4,
      p_payload: { display_name: "Updated" },
      p_idempotency_key: "onboarding-step-user-1-request-2:4",
    });
    expect(result.profileRevision).toBe(5);
  });

  it("does not hide non-concurrency authority failures", async () => {
    const { client, rpc } = makeClient({
      profileReads: [{ data: { profile_revision: 2 } }],
      rpcResults: [{
        error: { code: "42501", message: "Profile update denied" },
      }],
    });

    await expect(updateOnboardingProfileWithAuthority({
      supabase: client,
      userId: "user-1",
      payload: { bio: "No fallback" },
      idempotencyPrefix: "onboarding-step-user-1-request-3",
    })).rejects.toMatchObject({ code: "42501" });

    expect(rpc).toHaveBeenCalledTimes(1);
  });
});
