import { describe, it, expect, vi } from "vitest";
import {
  createMapProfile,
  createMapItem,
  createMapMessage,
  createMapSwapIntent,
  createMapNotification,
} from "@/lib/state/mappers";

// Mock nanoid to return predictable IDs
vi.mock("nanoid", () => ({ nanoid: () => "mock-id" }));

describe("createMapProfile", () => {
  const mapProfile = createMapProfile({ current: null });

  it("maps Supabase row to UserProfile", () => {
    const profile = mapProfile({
      id: "user-1",
      email: "test@example.com",
      display_name: "Ion Popescu",
      first_name: "Ion",
      avatar_url: "https://example.com/avatar.jpg",
      bio: "Salut!",
      languages: ["ro", "en"],
      badge: "premium",
    });
    expect(profile.id).toBe("user-1");
    expect(profile.email).toBe("test@example.com");
    expect(profile.displayName).toBe("Ion Popescu");
    expect(profile.firstName).toBe("Ion");
    expect(profile.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(profile.badge).toBe("premium");
    expect(profile.languages).toEqual(["ro", "en"]);
  });

  it("uses defaults for missing fields", () => {
    const profile = mapProfile({});
    expect(profile.displayName).toBe("Utilizator Swaply");
    expect(profile.badge).toBe("free");
    expect(profile.languages).toEqual(["ro"]);
  });

  it("maps snake_case to camelCase", () => {
    const profile = mapProfile({
      full_name: "Maria Ionescu",
      avatar_url: "https://example.com/pic.jpg",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(profile.fullName).toBe("Maria Ionescu");
    expect(profile.avatarUrl).toBe("https://example.com/pic.jpg");
    expect(profile.createdAt).toBe("2026-01-01T00:00:00Z");
  });

  it("identifies admin/moderator roles", () => {
    expect(mapProfile({ role: "admin" }).role).toBe("admin");
    expect(mapProfile({ role: "moderator" }).role).toBe("moderator");
    expect(mapProfile({ role: "user" }).role).toBe("user");
    expect(mapProfile({}).role).toBe("user");
  });

  it("maps location from nested location object", () => {
    const profile = mapProfile({
      location: {
        city: "București",
        region: "Ilfov",
        country: "Romania",
        postalCode: "010101",
      },
    });
    expect(profile.location?.city).toBe("București");
    expect(profile.location?.country).toBe("Romania");
  });
});

describe("createMapItem", () => {
  const mapItem = createMapItem({ current: null });

  it("maps Supabase row to Item", () => {
    const item = mapItem({
      id: "item-1",
      owner_id: "user-1",
      title: "Chitară Yamaha",
      category: "hobby_games",
      condition: "good",
      description: "Chitară acustică",
      wishlist: "laptop",
      status: "active",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      location: "București",
      images: ["https://example.com/1.jpg"],
      tags: ["muzica", "instrument"],
    });
    expect(item.id).toBe("item-1");
    expect(item.ownerId).toBe("user-1");
    expect(item.title).toBe("Chitară Yamaha");
    expect(item.condition).toBe("good");
    expect(item.photos).toEqual(["https://example.com/1.jpg"]);
    expect(item.aiSuggestedTags).toEqual(["muzica", "instrument"]);
  });

  it("uses defaults for missing fields", () => {
    const item = mapItem({});
    expect(item.title).toBe("Obiect fără titlu");
    expect(item.category).toBe("General");
    expect(item.condition).toBe("good");
    expect(item.status).toBe("active");
    expect(item.isActive).toBe(true);
  });

  it("extracts AI metadata fields", () => {
    const item = mapItem({
      title: "Test",
      ai_metadata: {
        intent: "committed",
        flexibility: "broad",
        perceivedValue: "large",
        acceptsBundle: true,
        recipientMatters: false,
        clarity: "know_exactly",
        context: "permanent",
        aiNote: "High value item",
      },
    });
    expect(item.intent).toBe("committed");
    expect(item.flexibility).toBe("broad");
    expect(item.perceivedValue).toBe("large");
    expect(item.acceptsBundle).toBe(true);
    expect(item.recipientMatters).toBe(false);
    expect(item.clarity).toBe("know_exactly");
    expect(item.context).toBe("permanent");
    expect(item.aiNote).toBe("High value item");
  });

  it("handles images as objects with url property", () => {
    const item = mapItem({
      images: [{ url: "https://example.com/1.jpg" }, { url: "https://example.com/2.jpg" }],
    });
    expect(item.photos).toEqual(["https://example.com/1.jpg", "https://example.com/2.jpg"]);
  });

  it("handles demo flag", () => {
    const item = mapItem({ is_demo: true });
    expect(item.isDemo).toBe(true);
  });
});

describe("createMapMessage", () => {
  const mapMessage = createMapMessage();

  it("maps Supabase row to ChatMessage", () => {
    const msg = mapMessage({
      id: "msg-1",
      conversation_id: "conv-1",
      sender_id: "user-1",
      recipient_id: "user-2",
      content: "Salut!",
      created_at: "2026-01-01T12:00:00Z",
      is_read: true,
    });
    expect(msg.id).toBe("msg-1");
    expect(msg.conversationId).toBe("conv-1");
    expect(msg.senderId).toBe("user-1");
    expect(msg.recipientId).toBe("user-2");
    expect(msg.content).toBe("Salut!");
    expect(msg.isRead).toBe(true);
  });

  it("defaults message type to text", () => {
    const msg = mapMessage({});
    expect(msg.messageType).toBe("text");
    expect(msg.isRead).toBe(false);
    expect(msg.translated).toBe(false);
    expect(msg.moderated).toBe(false);
  });

  it("maps attachments", () => {
    const msg = mapMessage({
      attachments: [{ id: "att-1", name: "photo.jpg", safe: true }],
    });
    expect(msg.attachments).toHaveLength(1);
    expect(msg.attachments![0].name).toBe("photo.jpg");
  });

  it("maps location messages", () => {
    const msg = mapMessage({
      message_type: "location",
      location_data: { lat: 44.4, lng: 26.1, label: "Centru" },
    });
    expect(msg.messageType).toBe("location");
    expect(msg.locationData?.lat).toBe(44.4);
  });

  it("uses swap_id as fallback for conversation_id", () => {
    const msg = mapMessage({ swap_id: "swap-123" });
    expect(msg.conversationId).toBe("swap-123");
  });
});

describe("createMapSwapIntent", () => {
  const mapSwap = createMapSwapIntent();

  it("maps Supabase row to SwapIntent", () => {
    const swap = mapSwap({
      id: "swap-1",
      requester_id: "user-1",
      responder_id: "user-2",
      offered_item_id: "item-1",
      requested_item_id: "item-2",
      status: "accepted",
      logistics: { locationType: "public_spot", meetupPoint: "Piața Universității" },
    });
    expect(swap.id).toBe("swap-1");
    expect(swap.requesterId).toBe("user-1");
    expect(swap.responderId).toBe("user-2");
    expect(swap.requesterItemId).toBe("item-1");
    expect(swap.responderItemId).toBe("item-2");
    expect(swap.status).toBe("accepted");
    expect(swap.logistics.locationType).toBe("public_spot");
  });

  it("defaults status to pending", () => {
    const swap = mapSwap({});
    expect(swap.status).toBe("pending");
  });

  it("maps feedback", () => {
    const swap = mapSwap({
      feedback: { rating: 5, comment: "Super!" },
    });
    expect(swap.feedback?.rating).toBe(5);
    expect(swap.feedback?.comment).toBe("Super!");
  });

  it("maps confirmation flags", () => {
    const swap = mapSwap({
      requester_confirmed: true,
      responder_confirmed: false,
    });
    expect(swap.requesterConfirmed).toBe(true);
    expect(swap.responderConfirmed).toBe(false);
  });
});

describe("createMapNotification", () => {
  const mapNotif = createMapNotification();

  it("maps Supabase row to Notification", () => {
    const notif = mapNotif({
      id: "notif-1",
      user_id: "user-1",
      type: "swap_proposal",
      title: "Propunere nouă",
      body: "Ai primit o propunere de schimb",
      is_read: false,
      priority: "info",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(notif.id).toBe("notif-1");
    expect(notif.userId).toBe("user-1");
    expect(notif.message).toContain("Propunere nouă");
    expect(notif.message).toContain("propunere de schimb");
    expect(notif.read).toBe(false);
    expect(notif.priority).toBe("info");
  });

  it("uses message field if provided", () => {
    const notif = mapNotif({ message: "Direct message" });
    expect(notif.message).toBe("Direct message");
  });

  it("combines title + body when message is empty", () => {
    const notif = mapNotif({ title: "Alert", body: "Something happened" });
    expect(notif.message).toBe("Alert: Something happened");
  });

  it("defaults read to false", () => {
    const notif = mapNotif({});
    expect(notif.read).toBe(false);
  });
});
