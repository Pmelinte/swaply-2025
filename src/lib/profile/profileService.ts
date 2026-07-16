import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  createProfileIdempotencyKey,
  mapGlobalProfileContract,
  type GlobalProfileContract,
  type ProfileUpdateInput,
  type ProfileUpdateResult,
} from "./profileContract";

const profileUpdateResponseSchema = z.object({
  replayed: z.boolean(),
  profile_revision: z.number().int().positive(),
  profile: z.record(z.unknown()),
});

const profileEnsureResponseSchema = z.object({
  created: z.boolean(),
  profile_revision: z.number().int().positive(),
  profile: z.record(z.unknown()),
});

export class ProfileServiceError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(
    message: string,
    options?: { code?: string; details?: string; hint?: string },
  ) {
    super(message);
    this.name = "ProfileServiceError";
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
  }

  get isStaleRevision() {
    return this.code === "40001";
  }

  get isConflict() {
    return this.code === "23505" || this.code === "40001";
  }
}

export interface FetchOwnProfileOptions {
  routeLocale?: string | null;
}

export interface EnsureOwnProfileOptions {
  routeLocale?: string | null;
}

export interface EnsureOwnProfileResult {
  created: boolean;
  profileRevision: number;
  profileRow: Record<string, unknown>;
  contract: GlobalProfileContract;
}

export interface UpdateOwnProfileOptions {
  expectedRevision: number;
  payload: Record<string, unknown>;
  idempotencyKey?: string;
  routeLocale?: string | null;
}

export interface UpdateOwnProfileResult {
  replayed: boolean;
  profileRevision: number;
  profileRow: Record<string, unknown>;
  contract: GlobalProfileContract;
}

export async function ensureOwnGlobalProfile(
  client: SupabaseClient,
  options: EnsureOwnProfileOptions = {},
): Promise<EnsureOwnProfileResult> {
  const { data, error } = await client.rpc("ensure_own_profile_v1", {
    p_route_locale: options.routeLocale ?? null,
  });

  if (error) throw profileError(error);

  const parsed = profileEnsureResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ProfileServiceError("Invalid profile bootstrap response.", {
      code: "INVALID_PROFILE_BOOTSTRAP_RESPONSE",
      details: parsed.error.message,
    });
  }

  return {
    created: parsed.data.created,
    profileRevision: parsed.data.profile_revision,
    profileRow: parsed.data.profile,
    contract: mapGlobalProfileContract(parsed.data.profile, options.routeLocale),
  };
}

export async function fetchOwnGlobalProfile(
  client: SupabaseClient,
  userId: string,
  options: FetchOwnProfileOptions = {},
): Promise<{ row: Record<string, unknown>; contract: GlobalProfileContract } | null> {
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw profileError(error);

  if (!data) {
    const ensured = await ensureOwnGlobalProfile(client, options);
    if (String(ensured.profileRow.user_id ?? "") !== userId) {
      throw new ProfileServiceError("Profile bootstrap returned another user.", {
        code: "PROFILE_BOOTSTRAP_ID_MISMATCH",
      });
    }

    return {
      row: ensured.profileRow,
      contract: ensured.contract,
    };
  }

  const row = data as Record<string, unknown>;
  return {
    row,
    contract: mapGlobalProfileContract(row, options.routeLocale),
  };
}

export async function updateOwnGlobalProfile(
  client: SupabaseClient,
  options: UpdateOwnProfileOptions,
): Promise<UpdateOwnProfileResult> {
  const input: ProfileUpdateInput = {
    expectedRevision: options.expectedRevision,
    idempotencyKey: options.idempotencyKey ?? createProfileIdempotencyKey(),
    payload: options.payload,
  };

  validateUpdateInput(input);

  const { data, error } = await client.rpc("update_own_profile_v1", {
    p_expected_revision: input.expectedRevision,
    p_payload: input.payload,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) throw profileError(error);

  const parsed = profileUpdateResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new ProfileServiceError("Invalid profile update response.", {
      code: "INVALID_PROFILE_RESPONSE",
      details: parsed.error.message,
    });
  }

  const result: ProfileUpdateResult = {
    replayed: parsed.data.replayed,
    profileRevision: parsed.data.profile_revision,
    profile: parsed.data.profile,
  };

  return {
    replayed: result.replayed,
    profileRevision: result.profileRevision,
    profileRow: result.profile,
    contract: mapGlobalProfileContract(result.profile, options.routeLocale),
  };
}

export function isProfileConflict(error: unknown): error is ProfileServiceError {
  return error instanceof ProfileServiceError && error.isConflict;
}

function validateUpdateInput(input: ProfileUpdateInput) {
  if (!Number.isInteger(input.expectedRevision) || input.expectedRevision < 1) {
    throw new ProfileServiceError("A positive profile revision is required.", {
      code: "INVALID_PROFILE_REVISION",
    });
  }

  if (input.idempotencyKey.trim().length < 8 || input.idempotencyKey.length > 120) {
    throw new ProfileServiceError("Invalid profile idempotency key.", {
      code: "INVALID_PROFILE_IDEMPOTENCY_KEY",
    });
  }

  if (!input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) {
    throw new ProfileServiceError("Profile payload must be an object.", {
      code: "INVALID_PROFILE_PAYLOAD",
    });
  }
}

function profileError(error: {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}) {
  return new ProfileServiceError(error.message, {
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
