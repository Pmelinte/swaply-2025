import { describe, expect, it } from "vitest";
import {
  sanitizeBlogPublicTruthContent,
  sanitizeBlogPublicTruthText,
} from "@/lib/blog-public-truth";

describe("blog public-truth guard", () => {
  it("keeps the product direction while removing false live-provider claims", () => {
    const input = [
      "Swaply's escrow feature holds both items until both parties confirm.",
      "Swaply's mediation team will review the evidence and help find a fair resolution.",
      "Complete identity verification by uploading a government-issued ID.",
    ].join("\n\n");

    const output = sanitizeBlogPublicTruthContent(input);

    expect(output).toContain("Production availability note");
    expect(output).toContain("not currently provided by Swaply");
    expect(output).toContain("no staffed mediation service");
    expect(output).not.toContain("Swaply's escrow feature");
    expect(output).not.toContain("government-issued ID");
  });

  it("relabels unverified testimonials and paid-plan titles", () => {
    expect(
      sanitizeBlogPublicTruthText(
        "Real Swap Stories That Will Inspire You to Start Trading",
      ),
    ).toContain("Illustrative Swap Scenarios");

    expect(
      sanitizeBlogPublicTruthText(
        "Swaply Free vs Premium: Is the Upgrade Worth It?",
      ),
    ).toContain("planned optional paid features");
  });

  it("does not add a notice to ordinary educational content", () => {
    const input = "Clear photos and honest descriptions help people evaluate an item.";
    expect(sanitizeBlogPublicTruthContent(input)).toBe(input);
  });
});
