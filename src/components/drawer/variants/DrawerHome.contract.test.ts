import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/drawer/variants/DrawerHome.tsx"),
  "utf8",
);

describe("canonical Home drawer", () => {
  it("has a dedicated Home identity and separate guest/authenticated states", () => {
    expect(source).toContain('data-drawer-page="home"');
    expect(source).toContain('data-home-state="guest"');
    expect(source).toContain('data-home-state="authenticated"');
    expect(source).toContain('data-drawer-section="home-onboarding"');
    expect(source).toContain('data-drawer-section="home-profile-status"');
  });

  it("covers the canonical authenticated Home responsibilities", () => {
    for (const action of [
      "home-profile",
      "home-notifications",
      "home-active-objects",
      "home-active-exchanges",
      "home-ai-recommendations",
      "home-rank-tokens",
      "home-blog",
      "home-stories",
    ]) {
      expect(source).toContain(`data-drawer-action="${action}"`);
    }
  });

  it("keeps the guest drawer focused on onboarding, safety, guides and stories", () => {
    for (const action of [
      "home-register",
      "home-login",
      "home-how-it-works",
      "home-safety",
      "home-blog",
      "home-stories",
    ]) {
      expect(source).toContain(`actionId="${action}"`);
    }
  });

  it("does not duplicate global or domain navigation", () => {
    for (const href of ["/objects", "/properties", "/services", "/events", "/explore", "/messages"]) {
      expect(source).not.toContain(`href="${href}"`);
    }
  });

  it("does not turn the contextual Home drawer into a legal site map", () => {
    for (const href of ["/privacy", "/cookies", "/terms", "/dmca", "/copyright"]) {
      expect(source).not.toContain(`href="${href}"`);
    }
  });
});
