import { describe, it, expect, vi } from "vitest";
import {
  generateCsrfToken,
  csrfCookieHeader,
  validateCsrf,
  getCsrfTokenFromCookie,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from "@/lib/csrf";

describe("generateCsrfToken", () => {
  it("generates a non-empty string", () => {
    const token = generateCsrfToken();
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("generates unique tokens", () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(10);
  });

  it("generates token with sufficient length", () => {
    const token = generateCsrfToken();
    expect(token.length).toBeGreaterThanOrEqual(16);
  });
});

describe("csrfCookieHeader", () => {
  it("creates valid Set-Cookie string", () => {
    const header = csrfCookieHeader("test-token-123");
    expect(header).toContain(`${CSRF_COOKIE_NAME}=test-token-123`);
    expect(header).toContain("SameSite=Strict");
    expect(header).toContain("Secure");
    expect(header).toContain("Path=/");
    expect(header).toContain("Max-Age=3600");
  });
});

describe("validateCsrf", () => {
  function makeRequest(cookieToken?: string, headerToken?: string): Request {
    const headers = new Headers();
    if (cookieToken) {
      headers.set("cookie", `${CSRF_COOKIE_NAME}=${cookieToken}`);
    }
    if (headerToken) {
      headers.set(CSRF_HEADER_NAME, headerToken);
    }
    return new Request("https://example.com/api/test", { headers });
  }

  it("returns true when cookie and header tokens match", () => {
    const token = "a-valid-csrf-token-1234567890";
    expect(validateCsrf(makeRequest(token, token))).toBe(true);
  });

  it("returns false when tokens mismatch", () => {
    expect(validateCsrf(makeRequest("token-a-1234567890", "token-b-1234567890"))).toBe(false);
  });

  it("returns false when cookie is missing", () => {
    expect(validateCsrf(makeRequest(undefined, "some-token"))).toBe(false);
  });

  it("returns false when header is missing", () => {
    expect(validateCsrf(makeRequest("some-token", undefined))).toBe(false);
  });

  it("returns false when both are missing", () => {
    expect(validateCsrf(makeRequest())).toBe(false);
  });

  it("returns false for short tokens (< 16 chars)", () => {
    expect(validateCsrf(makeRequest("short", "short"))).toBe(false);
  });

  it("handles multiple cookies", () => {
    const token = "valid-csrf-token-abcdefghijk";
    const headers = new Headers();
    headers.set("cookie", `other=value; ${CSRF_COOKIE_NAME}=${token}; another=test`);
    headers.set(CSRF_HEADER_NAME, token);
    const req = new Request("https://example.com/api/test", { headers });
    expect(validateCsrf(req)).toBe(true);
  });
});

describe("getCsrfTokenFromCookie", () => {
  it("returns null when document is undefined (server-side)", () => {
    // In jsdom, document exists, so we need to simulate no cookie
    Object.defineProperty(document, "cookie", { writable: true, value: "" });
    expect(getCsrfTokenFromCookie()).toBeNull();
  });

  it("returns token from document.cookie", () => {
    Object.defineProperty(document, "cookie", {
      writable: true,
      value: `${CSRF_COOKIE_NAME}=my-token-value`,
    });
    expect(getCsrfTokenFromCookie()).toBe("my-token-value");
  });
});
