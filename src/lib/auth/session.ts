export type AuthSessionState = "authenticated" | "anonymous" | "expired";

const DEFAULT_RETURN_TO = "/profile";

/**
 * Accept only same-origin application paths. This keeps login/logout redirects
 * deterministic and prevents protocol-relative or external redirects.
 */
export function normalizeAuthReturnTo(value: string | null | undefined): string {
  if (!value) return DEFAULT_RETURN_TO;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return DEFAULT_RETURN_TO;
  }

  try {
    const parsed = new URL(trimmed, "https://swaply.invalid");
    if (parsed.origin !== "https://swaply.invalid") return DEFAULT_RETURN_TO;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_RETURN_TO;
  }
}

export function classifySession(params: {
  hasSession: boolean;
  expiresAt?: number | null;
  nowSeconds?: number;
}): AuthSessionState {
  if (!params.hasSession) return "anonymous";

  const now = params.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (params.expiresAt && params.expiresAt <= now) return "expired";

  return "authenticated";
}

/**
 * Supabase emits several events for the same usable session. Hydration should
 * happen only when a session is available and the event can change user data.
 */
export function shouldHydrateSession(
  event: string,
  hasUser: boolean,
): boolean {
  if (!hasUser) return false;
  return event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED";
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Authentication failed. Please try again.";
}
