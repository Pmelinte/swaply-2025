const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationValidationResult =
  | { ok: true; email: string }
  | { ok: false; code: "terms" | "email" | "password" };

export function normalizeRegistrationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateRegistrationInput(
  email: string,
  password: string,
  acceptedTerms: boolean,
): RegistrationValidationResult {
  if (!acceptedTerms) return { ok: false, code: "terms" };

  const normalizedEmail = normalizeRegistrationEmail(email);
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return { ok: false, code: "email" };
  }

  if (password.length < 6) {
    return { ok: false, code: "password" };
  }

  return { ok: true, email: normalizedEmail };
}

/**
 * Accept only same-origin absolute paths. This prevents auth callback query
 * parameters such as `next=//example.com` from becoming open redirects.
 */
export function sanitizeAuthRedirect(
  value: string | null | undefined,
  fallback = "/profile",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://swaply.invalid");
    if (parsed.origin !== "https://swaply.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}
