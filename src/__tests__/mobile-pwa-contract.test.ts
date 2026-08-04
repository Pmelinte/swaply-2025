import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("V1-06.5 PWA contract", () => {
  it("keeps the manifest installable and global-first", () => {
    const manifest = JSON.parse(read("public/manifest.json")) as Record<string, unknown>;
    expect(manifest.display).toBe("standalone");
    expect(manifest.scope).toBe("/");
    expect(manifest.lang).toBe("en");
    expect(manifest.dir).toBe("auto");
    expect(manifest.orientation).toBe("any");
  });

  it("does not cache API responses or authenticated HTML", () => {
    const worker = read("public/sw.js");
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('request.headers.has("authorization")');
    expect(worker).toContain('const OFFLINE_URL = "/offline.html"');
    expect(worker).not.toContain("cache.put(event.request");
  });

  it("does not unregister the service worker from the locale layout", () => {
    const layout = read("src/app/[locale]/layout.tsx");
    expect(layout).not.toContain("getRegistrations()");
    expect(layout).not.toContain("registration.unregister()");
  });

  it("respects mobile safe areas and accessible touch targets", () => {
    const footer = read("src/components/layout/FooterNav.tsx");
    expect(footer).toContain("safe-area-inset-bottom");
    expect(footer).toContain("min-h-11");
    expect(footer).toContain("aria-current");
  });
});
