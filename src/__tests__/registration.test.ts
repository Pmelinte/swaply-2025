import { describe, expect, it } from "vitest";
import {
  normalizeRegistrationEmail,
  sanitizeAuthRedirect,
  validateRegistrationInput,
} from "../lib/auth/registration";

describe("registration input", () => {
  it("normalizes a valid email", () => {
    expect(normalizeRegistrationEmail("  Petru@Example.COM ")).toBe("petru@example.com");
  });

  it("requires terms acceptance", () => {
    expect(validateRegistrationInput("petru@example.com", "secret1", false)).toEqual({
      ok: false,
      code: "terms",
    });
  });

  it("rejects malformed email addresses", () => {
    expect(validateRegistrationInput("not-an-email", "secret1", true)).toEqual({
      ok: false,
      code: "email",
    });
  });

  it("rejects short passwords", () => {
    expect(validateRegistrationInput("petru@example.com", "12345", true)).toEqual({
      ok: false,
      code: "password",
    });
  });

  it("returns the normalized email for valid input", () => {
    expect(validateRegistrationInput(" Petru@Example.COM ", "secret1", true)).toEqual({
      ok: true,
      email: "petru@example.com",
    });
  });
});

describe("auth callback redirect", () => {
  it("keeps a same-origin application path", () => {
    expect(sanitizeAuthRedirect("/ro/profile?tab=account#security")).toBe(
      "/ro/profile?tab=account#security",
    );
  });

  it.each([
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "profile",
  ])("rejects an unsafe target: %s", (target) => {
    expect(sanitizeAuthRedirect(target)).toBe("/profile");
  });
});
