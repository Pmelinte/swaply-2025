import { describe, expect, it } from "vitest";
import {
  authErrorMessage,
  classifySession,
  normalizeAuthReturnTo,
  shouldHydrateSession,
} from "@/lib/auth/session";

describe("auth session contract", () => {
  it("accepts only same-origin application paths", () => {
    expect(normalizeAuthReturnTo("/profile?tab=account")).toBe("/profile?tab=account");
    expect(normalizeAuthReturnTo("https://evil.example")).toBe("/profile");
    expect(normalizeAuthReturnTo("//evil.example/path")).toBe("/profile");
    expect(normalizeAuthReturnTo(null)).toBe("/profile");
  });

  it("classifies missing and expired sessions", () => {
    expect(classifySession({ hasSession: false, nowSeconds: 100 })).toBe("anonymous");
    expect(classifySession({ hasSession: true, expiresAt: 99, nowSeconds: 100 })).toBe("expired");
    expect(classifySession({ hasSession: true, expiresAt: 101, nowSeconds: 100 })).toBe("authenticated");
  });

  it("hydrates only for relevant authenticated events", () => {
    expect(shouldHydrateSession("INITIAL_SESSION", true)).toBe(true);
    expect(shouldHydrateSession("SIGNED_IN", true)).toBe(true);
    expect(shouldHydrateSession("TOKEN_REFRESHED", true)).toBe(true);
    expect(shouldHydrateSession("SIGNED_OUT", false)).toBe(false);
    expect(shouldHydrateSession("PASSWORD_RECOVERY", true)).toBe(false);
  });

  it("normalizes unknown authentication errors", () => {
    expect(authErrorMessage(new Error("bad credentials"))).toBe("bad credentials");
    expect(authErrorMessage({})).toBe("Authentication failed. Please try again.");
  });
});
