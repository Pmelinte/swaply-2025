/**
 * CSRF protection utilities.
 * Uses double-submit cookie pattern for stateless CSRF prevention.
 *
 * How it works:
 * 1. Server generates a random token and sets it as a cookie
 * 2. Client reads the cookie and sends the token in a header (X-CSRF-Token)
 * 3. Server validates that cookie token === header token
 *
 * Since cookies follow same-origin policy and cross-origin requests
 * cannot read cookies, this prevents CSRF attacks.
 */

const CSRF_COOKIE_NAME = "swaply_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Generate a cryptographically random CSRF token.
 */
export function generateCsrfToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a Set-Cookie header value for the CSRF token.
 * Cookie is HttpOnly=false so client JS can read it, but SameSite=Strict for security.
 */
export function csrfCookieHeader(token: string): string {
  return `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Secure; Max-Age=3600`;
}

/**
 * Validate CSRF token from request.
 * Compares the cookie value with the header value.
 * Returns true if valid, false if mismatch or missing.
 */
export function validateCsrf(request: Request): boolean {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) return false;
  if (cookieToken.length < 16) return false;

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Parse a cookie header string into key-value pairs.
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key) cookies[key.trim()] = rest.join("=").trim();
  }
  return cookies;
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * React hook helper: get CSRF token from cookie (client-side).
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
