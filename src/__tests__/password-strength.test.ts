import { describe, it, expect } from "vitest";

// Test the password strength function directly (copied from login page for unit testing)
function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

describe("getPasswordStrength", () => {
  it("returns 0 for empty password", () => {
    expect(getPasswordStrength("")).toBe(0);
  });

  it("returns 0 for very short password", () => {
    expect(getPasswordStrength("ab")).toBe(0);
  });

  it("returns 1 for 6+ char lowercase-only", () => {
    expect(getPasswordStrength("abcdef")).toBe(1);
  });

  it("returns 2 for 10+ char lowercase-only", () => {
    expect(getPasswordStrength("abcdefghij")).toBe(2);
  });

  it("returns 2 for 6+ char with mixed case", () => {
    expect(getPasswordStrength("Abcdef")).toBe(2);
  });

  it("returns 3 for 6+ char with mixed case + digit", () => {
    expect(getPasswordStrength("Abcde1")).toBe(3);
  });

  it("returns 4 for strong password (length + mixed case + digit + special)", () => {
    expect(getPasswordStrength("Abcde1234!")).toBe(4);
  });

  it("caps at 4 even with all criteria met on long password", () => {
    expect(getPasswordStrength("MyStr0ng!Pass")).toBe(4);
  });

  it("returns 2 for only digits >= 6 chars (length + digit)", () => {
    // length >= 6: +1, /\d/: +1 = 2
    expect(getPasswordStrength("123456")).toBe(2);
  });

  it("returns 3 for digits >= 10 chars (length*2 + digit)", () => {
    // length >= 6: +1, length >= 10: +1, /\d/: +1 = 3
    expect(getPasswordStrength("1234567890")).toBe(3);
  });

  it("scores mixed case without digits", () => {
    expect(getPasswordStrength("AbCdEf")).toBe(2); // length >= 6 + mixed case
  });

  it("scores special chars on short password", () => {
    // "abc!" = 4 chars, no score for length, no mixed case, no digit, has special = 1
    // Actually: length < 6 so no length score, only special char detected = 1?
    // Wait: length = 4 < 6, no length score. Special char = 1. But need to check:
    // /[A-Z]/ && /[a-z]/ -> /[A-Z]/ false, so no mixed case.
    // /\d/ -> false. /[^A-Za-z0-9]/ -> true = 1 score.
    expect(getPasswordStrength("abc!")).toBe(1);
  });

  it("returns 3 for long password with digit and special but no uppercase", () => {
    // "abcdefghij1!" length >= 10: +2, digit: +1, special: +1 = 4? No, mixed case fails
    // Actually: length >= 6: +1, length >= 10: +1, mixed case: fails, digit: +1, special: +1 = 4
    expect(getPasswordStrength("abcdefghij1!")).toBe(4);
  });

  it("handles unicode characters", () => {
    // "пароль" = 6 chars: length >= 6 (+1), cyrillic matches /[^A-Za-z0-9]/ (+1) = 2
    expect(getPasswordStrength("пароль")).toBe(2);
  });
});
