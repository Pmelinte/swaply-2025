import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  resolve(process.cwd(), "src/components/drawer/variants/DrawerHome.tsx"),
  "utf8",
);

describe("canonical Home drawer", () => {
  it("has a dedicated Home identity and stable audit hooks", () => {
    expect(source).toContain('data-drawer-page="home"');
    expect(source).toContain('sectionId="home-dashboard"');
    expect(source).toContain('sectionId="home-get-started"');
    expect(source).toContain('sectionId="home-reputation"');
  });

  it("keeps authenticated Home actions focused on the user dashboard", () => {
    for (const href of [
      "/profile",
      "/my-objects",
      "/notifications",
      "/matching",
      "/exchange",
      "/history",
    ]) {
      expect(source).toContain(`href="${href}"`);
    }
  });

  it("does not duplicate the global branch navigation", () => {
    for (const href of ["/objects", "/properties", "/services", "/events", "/explore"]) {
      expect(source).not.toContain(`href="${href}"`);
    }
  });
});
