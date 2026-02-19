import { describe, it, expect } from "vitest";
import type {
  UserProfile,
  Item,
  ChatMessage,
  MatchCandidate,
  SwapIntent,
  Notification,
  TierBenefits,
  TokenLedgerEntry,
  AnalyticsEvent,
  BadgeTier,
  MatchTier,
  ListingType,
  ItemIntent,
  ItemFlexibility,
  ItemPerceivedValue,
  ItemClarity,
  ItemContext,
  CancelReason,
  AccountStatus,
  ChatMessageType,
} from "@/lib/types";

describe("Type system validation", () => {
  it("BadgeTier has expected values", () => {
    const tiers: BadgeTier[] = ["free", "premium", "platinum"];
    expect(tiers).toHaveLength(3);
  });

  it("MatchTier has expected values", () => {
    const tiers: MatchTier[] = ["weak", "possible", "good", "strong"];
    expect(tiers).toHaveLength(4);
  });

  it("ListingType has expected values", () => {
    const types: ListingType[] = ["object", "property", "service"];
    expect(types).toHaveLength(3);
  });

  it("ItemIntent has expected values", () => {
    const intents: ItemIntent[] = ["explore", "open", "committed", "high_commitment"];
    expect(intents).toHaveLength(4);
  });

  it("ItemFlexibility has expected values", () => {
    const flex: ItemFlexibility[] = ["strict", "moderate", "broad"];
    expect(flex).toHaveLength(3);
  });

  it("ItemPerceivedValue has expected values", () => {
    const vals: ItemPerceivedValue[] = ["small", "medium", "large", "sentimental"];
    expect(vals).toHaveLength(4);
  });

  it("ItemClarity has expected values", () => {
    const c: ItemClarity[] = ["exploring", "have_idea", "know_exactly"];
    expect(c).toHaveLength(3);
  });

  it("ItemContext has expected values", () => {
    const ctx: ItemContext[] = ["permanent", "vacation", "temporary", "urgent"];
    expect(ctx).toHaveLength(4);
  });

  it("CancelReason has expected values", () => {
    const reasons: CancelReason[] = [
      "changed_mind", "found_better", "no_response",
      "condition_mismatch", "logistics_issue", "safety_concern", "other",
    ];
    expect(reasons).toHaveLength(7);
  });

  it("AccountStatus has expected values", () => {
    const statuses: AccountStatus[] = ["active", "paused", "deleted"];
    expect(statuses).toHaveLength(3);
  });

  it("ChatMessageType has expected values", () => {
    const types: ChatMessageType[] = ["text", "location", "image"];
    expect(types).toHaveLength(3);
  });

  it("UserProfile shape is valid", () => {
    const user: UserProfile = {
      id: "test",
      email: "test@test.com",
      displayName: "Test User",
      languages: ["en", "ro"],
      badge: "free",
      visibility: { publicProfile: true, itemsVisibility: "public", showExactLocation: false, showLastSeen: true },
      notifications: { email: true, push: true, chat: true, matches: true, swapUpdates: true },
      swapPreferences: { logistics: "flexible" },
      security: { twoFactorEnabled: false, method: null, passkeysEnabled: false },
      stats: { tokens: 50, reputation: "starter", completedSwaps: 0, activeListings: 0 },
    };
    expect(user.id).toBe("test");
    expect(user.badge).toBe("free");
  });

  it("Item shape is valid", () => {
    const item: Item = {
      id: "item-1",
      ownerId: "user-1",
      title: "Test Item",
      category: "Electronică",
      condition: "good",
      description: "A test item",
      wishlist: "Something nice",
      status: "active",
      isActive: true,
      createdAt: "2026-01-01T00:00:00Z",
      location: "București",
      photos: [],
    };
    expect(item.status).toBe("active");
    expect(item.condition).toBe("good");
  });

  it("ChatMessage shape with location data", () => {
    const msg: ChatMessage = {
      id: "msg-1",
      conversationId: "conv-1",
      senderId: "user-1",
      content: "📍 44.433,26.104",
      createdAt: "2026-01-01T00:00:00Z",
      messageType: "location",
      locationData: { lat: 44.433, lng: 26.104, label: "București" },
      reactions: { "👍": ["user-2"] },
      readBy: ["user-1", "user-2"],
    };
    expect(msg.messageType).toBe("location");
    expect(msg.locationData?.lat).toBe(44.433);
    expect(msg.reactions?.["👍"]).toContain("user-2");
    expect(msg.readBy).toHaveLength(2);
  });

  it("SwapIntent shape with all fields", () => {
    const swap: SwapIntent = {
      id: "swap-1",
      requesterId: "user-1",
      responderId: "user-2",
      requesterItemId: "item-1",
      responderItemId: "item-2",
      swapType: "object",
      status: "proposed",
      logistics: { locationType: "public_spot", meetupPoint: "Piata Unirii" },
      notifications: ["Swap proposed"],
    };
    expect(swap.status).toBe("proposed");
    expect(swap.logistics.locationType).toBe("public_spot");
  });

  it("MatchCandidate shape with AI fields", () => {
    const match: MatchCandidate = {
      id: "match-1",
      itemOffered: { id: "i1", ownerId: "u1", title: "A", category: "X", condition: "new", description: "", wishlist: "", status: "active", isActive: true, createdAt: "", location: "", photos: [] },
      itemRequested: { id: "i2", ownerId: "u2", title: "B", category: "X", condition: "good", description: "", wishlist: "", status: "active", isActive: true, createdAt: "", location: "", photos: [] },
      compatibilityScore: 85,
      tier: "strong",
      reasons: ["Category match"],
      reason: "Category match.",
      aiAnalyzed: true,
      aiScoreBoost: 10,
      aiSummary: "Great match",
      aiConfidence: "high",
      aiProvider: "groq",
    };
    expect(match.tier).toBe("strong");
    expect(match.aiConfidence).toBe("high");
  });

  it("TierBenefits shape", () => {
    const benefits: TierBenefits = {
      mapPinVisible: true,
      priorityMatching: true,
      aiSuggestions: true,
      swapAnalytics: true,
      profileBadge: true,
      prioritySupport: true,
      monthlyTokens: 100,
      boostSlots: 5,
    };
    expect(benefits.monthlyTokens).toBe(100);
  });

  it("TokenLedgerEntry shape", () => {
    const entry: TokenLedgerEntry = {
      id: "txn-1",
      userId: "user-1",
      amount: 50,
      reason: "swap_completed",
      description: "Completed swap",
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(entry.reason).toBe("swap_completed");
  });

  it("AnalyticsEvent shape", () => {
    const event: AnalyticsEvent = {
      event: "page_view",
      properties: { page: "/home", userId: "user-1" },
      timestamp: "2026-01-01T00:00:00Z",
    };
    expect(event.event).toBe("page_view");
  });
});
