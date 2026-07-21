import { describe, expect, it } from "vitest";
import {
  buildLoginReturnTo,
  isAdminPageRoute,
  isPrivateApiRoute,
  isPrivatePageRoute,
  matchesRoute,
  shouldRedirectPrivatePage,
} from "@/lib/auth/routeProtection";

describe("private route protection", () => {
  it("matches only exact routes or true descendants", () => {
    expect(matchesRoute("/profile", "/profile")).toBe(true);
    expect(matchesRoute("/profile/security", "/profile")).toBe(true);
    expect(matchesRoute("/profile-public", "/profile")).toBe(false);
  });

  it("keeps guest demo pages public while protecting account routes", () => {
    expect(isPrivatePageRoute("/profile")).toBe(true);
    expect(isPrivatePageRoute("/objects/new")).toBe(true);
    expect(isPrivatePageRoute("/chat")).toBe(false);
    expect(isPrivatePageRoute("/messages")).toBe(false);
    expect(isPrivatePageRoute("/matching")).toBe(false);
    expect(isPrivatePageRoute("/exchange")).toBe(false);
  });

  it("keeps signed provider webhooks public and protects their parent APIs", () => {
    expect(isPrivateApiRoute("/api/payments/create-checkout")).toBe(true);
    expect(isPrivateApiRoute("/api/payments/webhook")).toBe(false);
    expect(isPrivateApiRoute("/api/payments/paypal/webhook")).toBe(false);
    expect(isPrivateApiRoute("/api/health")).toBe(false);
  });

  it("requires a valid authenticated user for private pages", () => {
    expect(shouldRedirectPrivatePage({ isPrivate: false, hasSessionCookie: false, hasValidUser: false })).toBe(false);
    expect(shouldRedirectPrivatePage({ isPrivate: true, hasSessionCookie: false, hasValidUser: false })).toBe(true);
    expect(shouldRedirectPrivatePage({ isPrivate: true, hasSessionCookie: true, hasValidUser: false })).toBe(true);
    expect(shouldRedirectPrivatePage({ isPrivate: true, hasSessionCookie: true, hasValidUser: true })).toBe(false);
  });

  it("preserves safe query strings and rejects protocol-relative return paths", () => {
    expect(buildLoginReturnTo("/profile", "?tab=account")).toBe("/profile?tab=account");
    expect(buildLoginReturnTo("//evil.example", "?next=/admin")).toBe("/profile?next=/admin");
    expect(buildLoginReturnTo("https://evil.example", "?x=1")).toBe("/profile?x=1");
  });

  it("identifies admin routes without matching lookalikes", () => {
    expect(isAdminPageRoute("/admin")).toBe(true);
    expect(isAdminPageRoute("/admin/users")).toBe(true);
    expect(isAdminPageRoute("/administrator")).toBe(false);
  });
});
