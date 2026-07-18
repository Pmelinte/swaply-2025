import type { SupabaseClient } from "@supabase/supabase-js";

const ONBOARDING_PROFILE_FIELDS = new Set([
  "display_name",
  "first_name",
  "avatar_url",
  "date_of_birth",
  "address_country",
  "address_city",
  "location",
  "languages",
  "swap_geo_range",
  "swap_context",
  "open_to_types",
  "swap_intent",
  "bio",
  "affinity_groups",
  "interests",
  "occupation",
  "onboarding_completed",
  "onboarding_step",
]);

export class OnboardingProfileAuthorityError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OnboardingProfileAuthorityError";
    this.code = code;
  }
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== "object" || !("code" in error)) return "UNKNOWN";
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" ? code : "UNKNOWN";
}

function errorMessage(error: unknown): string {
  if (!error || typeof error !== "object" || !("message" in error)) {
    return "Profile authority request failed.";
  }
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" ? message : "Profile authority request failed.";
}

function isStaleRevisionError(error: unknown): boolean {
  return errorCode(error) === "40001" || /stale profile revision/i.test(errorMessage(error));
}

function isMissingProfileError(error: unknown): boolean {
  return errorCode(error) === "PGRST116"
    || /0 rows|no rows|json object requested, multiple \(or no\) rows returned/i.test(errorMessage(error));
}

export function sanitizeOnboardingProfilePayload(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new OnboardingProfileAuthorityError(
      "INVALID_ONBOARDING_PAYLOAD",
      "Onboarding profile payload must be an object.",
    );
  }

  const payload = input as Record<string, unknown>;
  for (const key of Object.keys(payload)) {
    if (!ONBOARDING_PROFILE_FIELDS.has(key)) {
      throw new OnboardingProfileAuthorityError(
        "UNSUPPORTED_ONBOARDING_FIELD",
        `Unsupported onboarding profile field: ${key}`,
      );
    }
  }

  return { ...payload };
}

function buildIdempotencyKey(prefix: string, revision: number): string {
  const safePrefix = prefix
    .replace(/[^A-Za-z0-9._:-]/g, "-")
    .slice(0, 100);
  const key = `${safePrefix}:${revision}`;
  if (key.length < 8) {
    throw new OnboardingProfileAuthorityError(
      "INVALID_IDEMPOTENCY_PREFIX",
      "Onboarding idempotency prefix is too short.",
    );
  }
  return key.slice(0, 120);
}

async function readOwnProfileRevision(
  supabase: SupabaseClient,
  userId: string,
  allowBootstrap = true,
): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("profile_revision")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (allowBootstrap && isMissingProfileError(error)) {
      const { error: bootstrapError } = await supabase.rpc("ensure_own_profile_v1", {
        p_requested_locale: null,
      });
      if (bootstrapError) {
        throw new OnboardingProfileAuthorityError(
          errorCode(bootstrapError),
          errorMessage(bootstrapError),
        );
      }
      return readOwnProfileRevision(supabase, userId, false);
    }
    throw new OnboardingProfileAuthorityError(errorCode(error), errorMessage(error));
  }

  const revision = Number((data as { profile_revision?: unknown } | null)?.profile_revision);
  if (!Number.isInteger(revision) || revision < 1) {
    throw new OnboardingProfileAuthorityError(
      "INVALID_PROFILE_REVISION",
      "Profile revision is missing or invalid.",
    );
  }

  return revision;
}

export async function updateOnboardingProfileWithAuthority(options: {
  supabase: SupabaseClient;
  userId: string;
  payload: unknown;
  idempotencyPrefix: string;
}): Promise<{ profileRevision: number; profile: Record<string, unknown> | null }> {
  const payload = sanitizeOnboardingProfilePayload(options.payload);
  let revision = await readOwnProfileRevision(options.supabase, options.userId);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await options.supabase.rpc("update_own_profile_v1", {
      p_expected_revision: revision,
      p_payload: payload,
      p_idempotency_key: buildIdempotencyKey(options.idempotencyPrefix, revision),
    });

    if (!error) {
      const result = data as {
        profile_revision?: unknown;
        profile?: Record<string, unknown> | null;
      } | null;
      const profileRevision = Number(result?.profile_revision);
      if (!Number.isInteger(profileRevision) || profileRevision < 1) {
        throw new OnboardingProfileAuthorityError(
          "INVALID_PROFILE_RPC_RESPONSE",
          "Profile authority response omitted a valid revision.",
        );
      }
      return {
        profileRevision,
        profile: result?.profile ?? null,
      };
    }

    if (attempt === 0 && isStaleRevisionError(error)) {
      revision = await readOwnProfileRevision(options.supabase, options.userId, false);
      continue;
    }

    throw new OnboardingProfileAuthorityError(errorCode(error), errorMessage(error));
  }

  throw new OnboardingProfileAuthorityError(
    "PROFILE_AUTHORITY_RETRY_EXHAUSTED",
    "Profile authority retry was exhausted.",
  );
}
