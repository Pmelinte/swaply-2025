import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileBridgeMode = "rpc" | "legacy";

export interface ProfileBridgeResult {
  mode: ProfileBridgeMode;
  profileRow: Record<string, unknown>;
  profileRevision: number;
  replayed: boolean;
}

export interface EnsureOwnProfileBridgeOptions {
  routeLocale: string;
  legacyPayload: Record<string, unknown>;
}

export interface UpdateOwnProfileBridgeOptions {
  expectedRevision: number;
  canonicalPayload: Record<string, unknown>;
  legacyPayload: Record<string, unknown>;
  idempotencyKey?: string;
}

interface SupabaseErrorLike {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export class ProfileCompatibilityBridgeError extends Error {
  readonly code?: string;
  readonly details?: string;
  readonly hint?: string;

  constructor(
    message: string,
    options?: { code?: string; details?: string; hint?: string },
  ) {
    super(message);
    this.name = "ProfileCompatibilityBridgeError";
    this.code = options?.code;
    this.details = options?.details;
    this.hint = options?.hint;
  }
}

const MISSING_RPC_CODES = new Set(["42883", "PGRST202"]);

export function isMissingProfileRpcError(
  error: SupabaseErrorLike | null | undefined,
  rpcName: "ensure_own_profile_v1" | "update_own_profile_v1",
): boolean {
  if (!error || !MISSING_RPC_CODES.has(error.code ?? "")) return false;

  const message = [error.message, error.details, error.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return message.includes(rpcName.toLowerCase());
}

export function createProfileBridgeIdempotencyKey(): string {
  const randomPart = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `profile-bridge-${randomPart}`.slice(0, 120);
}

export async function ensureOwnProfileWithCompatibility(
  client: SupabaseClient,
  options: EnsureOwnProfileBridgeOptions,
): Promise<ProfileBridgeResult> {
  const { data, error } = await client.rpc("ensure_own_profile_v1", {
    p_route_locale: options.routeLocale,
  });

  if (!error) {
    return parseRpcProfileResult(data, false);
  }

  if (!isMissingProfileRpcError(error, "ensure_own_profile_v1")) {
    throw bridgeError(error);
  }

  return legacyProfileUpsert(
    client,
    withDeterministicBootstrapUsername(options.legacyPayload),
  );
}

export async function updateOwnProfileWithCompatibility(
  client: SupabaseClient,
  options: UpdateOwnProfileBridgeOptions,
): Promise<ProfileBridgeResult> {
  if (!Number.isInteger(options.expectedRevision) || options.expectedRevision < 1) {
    throw new ProfileCompatibilityBridgeError(
      "A positive expected profile revision is required.",
      { code: "INVALID_PROFILE_REVISION" },
    );
  }

  const idempotencyKey = options.idempotencyKey
    ?? createProfileBridgeIdempotencyKey();

  const { data, error } = await client.rpc("update_own_profile_v1", {
    p_expected_revision: options.expectedRevision,
    p_payload: options.canonicalPayload,
    p_idempotency_key: idempotencyKey,
  });

  if (!error) {
    return parseRpcProfileResult(data, true);
  }

  if (!isMissingProfileRpcError(error, "update_own_profile_v1")) {
    throw bridgeError(error);
  }

  return legacyProfileUpsert(client, options.legacyPayload);
}

function withDeterministicBootstrapUsername(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const userId = typeof payload.user_id === "string"
    ? payload.user_id.trim()
    : "";
  const email = typeof payload.email === "string"
    ? payload.email.trim()
    : "";
  const username = typeof payload.username === "string"
    ? payload.username.trim()
    : "";

  if (!userId || (email && username && username !== "user")) {
    return payload;
  }

  return {
    ...payload,
    username: `user_${userId.replace(/-/g, "")}`,
  };
}

async function legacyProfileUpsert(
  client: SupabaseClient,
  payload: Record<string, unknown>,
): Promise<ProfileBridgeResult> {
  const { data, error } = await client
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) throw bridgeError(error);
  if (!isRecord(data)) {
    throw new ProfileCompatibilityBridgeError(
      "Legacy profile fallback returned no profile row.",
      { code: "INVALID_LEGACY_PROFILE_RESPONSE" },
    );
  }

  return {
    mode: "legacy",
    profileRow: data,
    profileRevision: readLegacyRevision(data.profile_revision),
    replayed: false,
  };
}

function parseRpcProfileResult(
  data: unknown,
  allowReplayFlag: boolean,
): ProfileBridgeResult {
  if (!isRecord(data) || !isRecord(data.profile)) {
    throw invalidRpcResponse();
  }

  const profileRevision = readStrictRpcRevision(data, data.profile);

  return {
    mode: "rpc",
    profileRow: data.profile,
    profileRevision,
    replayed: allowReplayFlag && data.replayed === true,
  };
}

function readStrictRpcRevision(
  envelope: Record<string, unknown>,
  profile: Record<string, unknown>,
): number {
  const hasEnvelopeRevision = Object.prototype.hasOwnProperty.call(
    envelope,
    "profile_revision",
  );
  const hasProfileRevision = Object.prototype.hasOwnProperty.call(
    profile,
    "profile_revision",
  );

  if (!hasEnvelopeRevision && !hasProfileRevision) {
    throw invalidRpcResponse();
  }

  const envelopeRevision = hasEnvelopeRevision
    ? readRequiredPositiveRevision(envelope.profile_revision)
    : undefined;
  const profileRevision = hasProfileRevision
    ? readRequiredPositiveRevision(profile.profile_revision)
    : undefined;

  if (
    envelopeRevision !== undefined
    && profileRevision !== undefined
    && envelopeRevision !== profileRevision
  ) {
    throw invalidRpcResponse();
  }

  return envelopeRevision ?? profileRevision ?? 1;
}

function readRequiredPositiveRevision(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }

  throw invalidRpcResponse();
}

function readLegacyRevision(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 1;
}

function invalidRpcResponse(): ProfileCompatibilityBridgeError {
  return new ProfileCompatibilityBridgeError(
    "Profile RPC returned an invalid response.",
    { code: "INVALID_PROFILE_RPC_RESPONSE" },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function bridgeError(error: SupabaseErrorLike): ProfileCompatibilityBridgeError {
  return new ProfileCompatibilityBridgeError(
    error.message ?? "Profile persistence failed.",
    {
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  );
}
