import { describe, expect, it } from "vitest";
import {
  PUBLIC_PAGE_METADATA,
  buildPublicPageMetadata,
  getPublicPageMetadataEntry,
} from "@/lib/public-pages/publicPageMetadata";
import { getPublicSeoAuditRoutes } from "@/lib/public-pages/publicRouteAudit";

const GENERIC_HOME_TITLE = "Swaply — Swap objects without money";

describe("public per-page metadata", () => {
  it("covers every public SEO audit route", () => {
    const metadataPaths = PUBLIC_PAGE_METADATA.map((entry) =>
      entry.path === "/" ? "/en" : `/en${entry.path}`,
    );

    expect(metadataPaths.sort()).toEqual(getPublicSeoAuditRoutes("en").sort());
  });

  it("keeps every public metadata path unique", () => {
    const paths = PUBLIC_PAGE_METADATA.map((entry) => entry.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("keeps every public metadata title and description meaningful", () => {
    for (const entry of PUBLIC_PAGE_METADATA) {
      expect(entry.title).toContain("Swaply");
      expect(entry.title.length).toBeGreaterThan(12);
      expect(entry.description.length).toBeGreaterThan(70);
    }
  });

  it("does not reuse homepage title for legal pages", () => {
    for (const id of ["terms", "privacy", "cookies", "safety", "dmca", "copyright"] as const) {
      expect(getPublicPageMetadataEntry(id).title).not.toBe(GENERIC_HOME_TITLE);
    }
  });

  it("builds canonical and hreflang metadata for the exact route", () => {
    const metadata = buildPublicPageMetadata("en", "privacy");

    expect(metadata.title).toEqual({ absolute: "Privacy Policy | Swaply" });
    expect(metadata.description).toContain("GDPR");
    expect(metadata.alternates?.canonical).toBe("https://www.swaply.world/en/privacy");
    expect(metadata.alternates?.languages).toMatchObject({
      en: "https://www.swaply.world/en/privacy",
      ro: "https://www.swaply.world/ro/privacy",
      "x-default": "https://www.swaply.world/en/privacy",
    });
  });
});
