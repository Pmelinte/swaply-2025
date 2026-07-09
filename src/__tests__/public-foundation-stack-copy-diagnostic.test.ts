import { describe, expect, it } from "vitest";
import { PUBLIC_FOUNDATION_STACK_TRACKS } from "@/lib/public-foundation-stack/publicFoundationStackContent";
import type { PublicFoundationStackTrackId } from "@/lib/public-foundation-stack/publicFoundationStackTypes";

const DEFAULT_LOCALE = "en";
const COPY_FIELDS = ["title", "summary", "publicPromise", "badge", "ctaLabel"] as const;

type CopyField = (typeof COPY_FIELDS)[number];
type TrackCopy = Record<CopyField, string>;
type CopyTable = Record<PublicFoundationStackTrackId, TrackCopy>;
type PartialLocalizedCopyTable = Partial<Record<PublicFoundationStackTrackId, Partial<TrackCopy>>>;

function getDefaultCopyTable(): CopyTable {
  return PUBLIC_FOUNDATION_STACK_TRACKS.reduce((copyTable, track) => {
    copyTable[track.id] = {
      title: track.title,
      summary: track.summary,
      publicPromise: track.publicPromise,
      badge: track.badge,
      ctaLabel: track.ctaLabel,
    };

    return copyTable;
  }, {} as CopyTable);
}

function normalizeLocale(locale?: string | null) {
  return locale?.toLowerCase().split("-")[0] || DEFAULT_LOCALE;
}

function resolveDiagnosticCopy(
  trackId: PublicFoundationStackTrackId,
  locale: string | null | undefined,
  localizedCopyByLocale: Record<string, PartialLocalizedCopyTable>,
): TrackCopy {
  const defaultCopyTable = getDefaultCopyTable();
  const normalizedLocale = normalizeLocale(locale);

  return {
    ...defaultCopyTable[trackId],
    ...localizedCopyByLocale[normalizedLocale]?.[trackId],
  };
}

describe("public foundation stack copy fallback diagnostic", () => {
  it("can derive a complete default copy table from the existing runtime config", () => {
    const defaultCopyTable = getDefaultCopyTable();

    expect(Object.keys(defaultCopyTable).sort()).toEqual(
      PUBLIC_FOUNDATION_STACK_TRACKS.map((track) => track.id).sort(),
    );

    for (const track of PUBLIC_FOUNDATION_STACK_TRACKS) {
      for (const field of COPY_FIELDS) {
        expect(defaultCopyTable[track.id][field].trim(), `${track.id}.${field} should not be blank`).not.toEqual("");
      }
    }
  });

  it("falls back field-by-field when a locale is incomplete", () => {
    const fallbackCopy = resolveDiagnosticCopy("ai_advisory", "ro-RO", {
      ro: {
        ai_advisory: {
          title: "AI explică, oamenii decid",
        },
      },
    });

    expect(fallbackCopy.title).toBe("AI explică, oamenii decid");
    expect(fallbackCopy.summary).toBe("AI can classify, translate, summarize and recommend, but it remains advisory.");
    expect(fallbackCopy.publicPromise).toBe(
      "Every important AI suggestion needs human confirmation and a fallback path.",
    );
    expect(fallbackCopy.badge).toBe("Advisory AI");
    expect(fallbackCopy.ctaLabel).toBe("See AI preview");
  });

  it("falls back to English when a requested locale is missing", () => {
    const fallbackCopy = resolveDiagnosticCopy("language_fallback", "de-DE", {});
    const defaultCopy = resolveDiagnosticCopy("language_fallback", DEFAULT_LOCALE, {});

    expect(fallbackCopy).toEqual(defaultCopy);
  });
});
