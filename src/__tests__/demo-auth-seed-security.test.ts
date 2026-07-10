import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const guardedFiles = [
  "supabase/seed.sql",
  "supabase/fix-auth-identities.sql",
];

describe("demo Auth seed security", () => {
  it.each(guardedFiles)("does not contain the former shared demo password in %s", (relativePath) => {
    const content = readFileSync(join(repositoryRoot, relativePath), "utf8");

    expect(content).not.toContain("DemoSwap2025!");
  });

  it("keeps the active seed in quarantine mode", () => {
    const content = readFileSync(join(repositoryRoot, "supabase/seed.sql"), "utf8");

    expect(content).toContain("demo seed is disabled");
    expect(content).not.toContain("INSERT INTO auth.users");
  });
});
