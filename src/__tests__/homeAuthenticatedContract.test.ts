import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\s+/g, " ");
}

describe("V1-03.3 authenticated Home contract", () => {
  const home = source("src/app/[locale]/HomePageClient.tsx");

  it("keeps guest and authenticated Home separated", () => {
    expect(home).toContain("function GuestHome()");
    expect(home).toContain("function AuthenticatedHome()");
    expect(home).toContain("return user ? <AuthenticatedHome /> : <GuestHome />");
    expect(home).toContain('data-home-state="authenticated"');
  });

  it("uses real application state for personal priorities", () => {
    expect(home).toContain("items,");
    expect(home).toContain("matches,");
    expect(home).toContain("conversations,");
    expect(home).toContain("swaps,");
    expect(home).toContain("notifications,");
    expect(home).toContain("tokenBalance,");
    expect(home).toContain("const prioritySignals = [");
  });

  it("implements resume, action and recommendation sections", () => {
    expect(home).toContain('data-analytics-event="resume_action_opened"');
    expect(home).toContain('data-analytics-event="onboarding_action"');
    expect(home).toContain('data-analytics-event="recommendation_opened"');
    expect(home).toContain("const resumeCards = [");
    expect(home).toContain("const actionCards = [");
    expect(home).toContain("const relevantMatches = [...matches]");
  });

  it("limits recommendations and provides non-AI fallback text", () => {
    expect(home).toContain(".slice(0, 3)");
    expect(home).toContain("match.manualFallbackReason");
    expect(home).toContain('tMatch("ai_title")');
  });

  it("does not turn Home into an exhaustive catalog", () => {
    expect(home).not.toContain("infinite scroll");
    expect(home).not.toContain("loadMoreItems");
    expect(home).not.toContain("searchFilters");
  });
});
