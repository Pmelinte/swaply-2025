import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("V1-09.3.1 performance measurement foundation", () => {
  it("keeps Lighthouse measurement scoped to canonical public routes", () => {
    const config = read("lighthouserc.cjs");

    for (const route of [
      "/en",
      "/en/explore",
      "/en/objects",
      "/en/properties",
      "/en/services",
      "/en/events",
      "/en/blog",
      "/en/about",
      "/en/contact",
    ]) {
      expect(config).toContain(`http://127.0.0.1:3000${route}`);
    }

    expect(config).not.toContain("/en/home");
    expect(config).toContain('onlyCategories: ["performance"]');
    expect(config).toContain('target: "filesystem"');
  });

  it("runs as an evidence-producing PR workflow without changing production providers", () => {
    const workflow = read(".github/workflows/v1-09-3-1-performance-audit.yml");

    expect(workflow).toContain("Lighthouse public-route baseline");
    expect(workflow).toContain("@lhci/cli@0.15.1");
    expect(workflow).toContain("npm run build");
    expect(workflow).toContain("npx lhci autorun --config=lighthouserc.cjs");
    expect(workflow).toContain("v1-09-3-1-performance-evidence-${{ github.run_id }}");
    expect(workflow).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(workflow).not.toContain("STRIPE_SECRET_KEY");
  });
});
