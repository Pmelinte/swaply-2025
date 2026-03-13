import { describe, it, expect } from "vitest";
import {
  computeTrustScore,
  computeFriction,
  checkMessageForScam,
  defaultTrustSignals,
  buildTrustSignals,
  type TrustSignals,
} from "@/lib/trust";

// ── Helper to build signals with overrides ──
function signals(overrides: Partial<TrustSignals> = {}): TrustSignals {
  return { ...defaultTrustSignals(), ...overrides };
}

describe("computeTrustScore", () => {
  it("returns 0 for blocked users", () => {
    const result = computeTrustScore(signals({ isBlocked: true, emailVerified: true, completedSwaps: 50 }));
    expect(result.score).toBe(0);
    expect(result.level).toBe("new");
  });

  it("returns low score for brand new user", () => {
    const result = computeTrustScore(defaultTrustSignals());
    expect(result.score).toBeLessThan(15);
    expect(result.level).toBe("new");
  });

  it("gives verification points for email", () => {
    const withEmail = computeTrustScore(signals({ emailVerified: true }));
    const without = computeTrustScore(defaultTrustSignals());
    expect(withEmail.score).toBeGreaterThan(without.score);
    expect(withEmail.breakdown.verification).toBe(8);
  });

  it("gives verification points for phone", () => {
    const result = computeTrustScore(signals({ phoneVerified: true }));
    expect(result.breakdown.verification).toBe(7);
  });

  it("gives both email + phone = 15", () => {
    const result = computeTrustScore(signals({ emailVerified: true, phoneVerified: true }));
    expect(result.breakdown.verification).toBe(15);
  });

  it("caps account age at 15", () => {
    const result = computeTrustScore(signals({ accountAgeDays: 365 }));
    expect(result.breakdown.accountAge).toBe(15);
  });

  it("computes swap history score", () => {
    const result = computeTrustScore(signals({ completedSwaps: 10 }));
    expect(result.breakdown.swapHistory).toBe(25);
  });

  it("caps swap history at 25", () => {
    const result = computeTrustScore(signals({ completedSwaps: 100 }));
    expect(result.breakdown.swapHistory).toBe(25);
  });

  it("computes ratings score", () => {
    const result = computeTrustScore(signals({
      averageRating: 5,
      totalRatingsReceived: 5,
    }));
    expect(result.breakdown.ratings).toBe(20);
  });

  it("penalizes reports against user", () => {
    const clean = computeTrustScore(signals());
    const reported = computeTrustScore(signals({ reportsAgainst: 2 }));
    expect(reported.breakdown.behavior).toBeLessThan(clean.breakdown.behavior);
  });

  it("rewards dismissed reports", () => {
    const result = computeTrustScore(signals({ reportsDismissed: 3 }));
    expect(result.breakdown.behavior).toBeGreaterThan(10);
  });

  it("gives engagement for avatar and location", () => {
    const result = computeTrustScore(signals({ hasAvatar: true, hasLocation: true }));
    expect(result.breakdown.engagement).toBeGreaterThanOrEqual(4);
  });

  it("returns 'ambassador' level for high trust score", () => {
    const result = computeTrustScore(signals({
      accountAgeDays: 365,
      emailVerified: true,
      phoneVerified: true,
      completedSwaps: 20,
      averageRating: 4.8,
      totalRatingsReceived: 10,
      reportsDismissed: 2,
      hasAvatar: true,
      hasLocation: true,
      profileCompleteness: 100,
      consecutiveLoginDays: 30,
    }));
    expect(result.level).toBe("ambassador");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("returns correct trust levels at boundaries", () => {
    // We test the trust level function indirectly
    const basicUser = computeTrustScore(signals({
      emailVerified: true,
      accountAgeDays: 30,
    }));
    expect(basicUser.score).toBeGreaterThanOrEqual(15);
    expect(["basic", "trusted", "verified", "ambassador"]).toContain(basicUser.level);
  });

  it("never exceeds 100", () => {
    const result = computeTrustScore(signals({
      accountAgeDays: 9999,
      emailVerified: true,
      phoneVerified: true,
      completedSwaps: 999,
      averageRating: 5,
      totalRatingsReceived: 999,
      reportsDismissed: 99,
      hasAvatar: true,
      hasLocation: true,
      profileCompleteness: 100,
      consecutiveLoginDays: 999,
    }));
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const result = computeTrustScore(signals({ reportsAgainst: 10 }));
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

describe("computeFriction", () => {
  it("auto-holds accounts with 3+ reports", () => {
    const result = computeFriction(50, 3);
    expect(result.autoHold).toBe(true);
    expect(result.maxMessagesPerDay).toBe(0);
    expect(result.canSendLinks).toBe(false);
    expect(result.requiresModeration).toBe(true);
  });

  it("restricts new users (score < 15)", () => {
    const result = computeFriction(10, 0);
    expect(result.maxMessagesPerDay).toBe(10);
    expect(result.maxChatsPerDay).toBe(3);
    expect(result.canSendLinks).toBe(false);
    expect(result.canSendImages).toBe(false);
    expect(result.requiresModeration).toBe(true);
  });

  it("moderate restrictions for basic users (15-39)", () => {
    const result = computeFriction(25, 0);
    expect(result.maxMessagesPerDay).toBe(30);
    expect(result.canSendLinks).toBe(false);
    expect(result.canSendImages).toBe(true);
    expect(result.requiresModeration).toBe(false);
  });

  it("light restrictions for trusted users (40-64)", () => {
    const result = computeFriction(50, 0);
    expect(result.maxMessagesPerDay).toBe(100);
    expect(result.canSendLinks).toBe(true);
    expect(result.requiresModeration).toBe(false);
  });

  it("no restrictions for verified+ users (65+)", () => {
    const result = computeFriction(80, 0);
    expect(result.maxMessagesPerDay).toBe(999);
    expect(result.canSendLinks).toBe(true);
    expect(result.canShareLocation).toBe(true);
    expect(result.autoHold).toBe(false);
  });

  it("reports override trust score for auto-hold", () => {
    const result = computeFriction(90, 5);
    expect(result.autoHold).toBe(true);
    expect(result.maxMessagesPerDay).toBe(0);
  });
});

describe("checkMessageForScam", () => {
  it("returns none severity for clean message", () => {
    const result = checkMessageForScam("Salut, vreau să facem schimb!");
    expect(result.severity).toBe("none");
    expect(result.blocked).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects off-platform patterns", () => {
    const result = checkMessageForScam("Scrie-mi pe WhatsApp la 07xx");
    expect(result.severity).toBe("medium");
    expect(result.patterns).toContain("off_platform");
  });

  it("detects money transfer patterns", () => {
    const result = checkMessageForScam("Trimite bani pe Revolut");
    expect(result.patterns).toContain("money_transfer");
  });

  it("detects urgency patterns", () => {
    const result = checkMessageForScam("Urgent! Doar azi, grăbește-te!");
    expect(result.patterns).toContain("urgency_pressure");
  });

  it("detects suspicious URLs", () => {
    const result = checkMessageForScam("Click pe bit.ly/abc123 să vezi oferta");
    expect(result.patterns).toContain("suspicious_url");
  });

  it("detects phone numbers", () => {
    const result = checkMessageForScam("Sună-mă la 0723456789");
    expect(result.patterns).toContain("phone_number");
  });

  it("blocks high severity (off-platform + money)", () => {
    const result = checkMessageForScam("Scrie-mi pe telegram și trimite bani pe PayPal");
    expect(result.severity).toBe("high");
    expect(result.blocked).toBe(true);
  });

  it("escalates severity when combining patterns", () => {
    const offPlatform = checkMessageForScam("Scrie-mi pe WhatsApp");
    const combined = checkMessageForScam("Scrie-mi pe WhatsApp și trimite bani");
    expect(combined.severity).toBe("high");
    expect(offPlatform.severity).toBe("medium");
  });
});

describe("defaultTrustSignals", () => {
  it("returns all zeroed/false signals", () => {
    const s = defaultTrustSignals();
    expect(s.accountAgeDays).toBe(0);
    expect(s.emailVerified).toBe(false);
    expect(s.completedSwaps).toBe(0);
    expect(s.isBlocked).toBe(false);
  });
});

describe("buildTrustSignals", () => {
  it("computes profile completeness from user fields", () => {
    const s = buildTrustSignals({
      avatarUrl: "https://example.com/avatar.jpg",
      location: { city: "București", country: "Romania" },
      bio: "Bio de minim 10 caractere!",
      stats: { completedSwaps: 5 },
    });
    expect(s.profileCompleteness).toBe(100);
    expect(s.hasAvatar).toBe(true);
    expect(s.hasLocation).toBe(true);
    expect(s.completedSwaps).toBe(5);
  });

  it("handles missing profile fields", () => {
    const s = buildTrustSignals({
      stats: { completedSwaps: 0 },
    });
    expect(s.profileCompleteness).toBe(0);
    expect(s.hasAvatar).toBe(false);
    expect(s.hasLocation).toBe(false);
  });

  it("uses extra overrides", () => {
    const s = buildTrustSignals(
      { stats: { completedSwaps: 0 } },
      { accountAgeDays: 90, reportsAgainst: 2, averageRating: 4.5 },
    );
    expect(s.accountAgeDays).toBe(90);
    expect(s.reportsAgainst).toBe(2);
    expect(s.averageRating).toBe(4.5);
  });
});
