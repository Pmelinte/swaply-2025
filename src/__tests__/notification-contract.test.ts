import { describe, expect, it } from "vitest";
import {
  countUnreadNotifications,
  dedupeNotifications,
  getNotificationHref,
  type NotificationRow,
} from "../lib/notifications/notificationQueries";

function notification(overrides: Partial<NotificationRow> = {}): NotificationRow {
  return {
    id: "notification-1",
    user_id: "user-1",
    type: "swap_update",
    title: "Update",
    body: null,
    title_key: null,
    body_key: null,
    data: null,
    read: false,
    is_read: false,
    priority: "normal",
    source_type: null,
    source_id: null,
    dedupe_key: null,
    created_at: "2026-08-04T00:00:00.000Z",
    ...overrides,
  };
}

describe("notification deep-link contract", () => {
  it("targets the exact exchange detail route", () => {
    expect(
      getNotificationHref(notification({ data: { swap_id: "swap-123" } })),
    ).toBe("/exchange/swap-123");
  });

  it("encodes conversation identifiers in the query parameter", () => {
    expect(
      getNotificationHref(
        notification({ data: { conversation_id: "conversation/unsafe?x=1" } }),
      ),
    ).toBe("/chat?conversation=conversation%2Funsafe%3Fx%3D1");
  });

  it("uses conversation before match and swap when all identifiers exist", () => {
    expect(
      getNotificationHref(
        notification({
          data: {
            conversation_id: "conversation-1",
            match_id: "match-1",
            swap_id: "swap-1",
          },
        }),
      ),
    ).toBe("/chat?conversation=conversation-1");
  });

  it("uses match before swap and encodes the match query parameter", () => {
    expect(
      getNotificationHref(
        notification({
          data: {
            match_id: "match/unsafe?x=1",
            swap_id: "swap-1",
          },
        }),
      ),
    ).toBe("/matching?match=match%2Funsafe%3Fx%3D1");
  });

  it("encodes swap identifiers in the exchange path segment", () => {
    expect(
      getNotificationHref(
        notification({ data: { swap_id: "swap/unsafe?x=1" } }),
      ),
    ).toBe("/exchange/swap%2Funsafe%3Fx%3D1");
  });

  it("falls back safely when identifiers are empty or invalid", () => {
    expect(
      getNotificationHref(
        notification({ data: { swap_id: "   ", match_id: 42 } }),
      ),
    ).toBe("/notifications");
  });
});

describe("notification dedupe contract", () => {
  it("keeps only the newest row for a repeated dedupe key", () => {
    const rows = [
      notification({ id: "newest", dedupe_key: "swap:1:accepted" }),
      notification({ id: "older", dedupe_key: "swap:1:accepted" }),
    ];

    expect(dedupeNotifications(rows).map((row) => row.id)).toEqual(["newest"]);
  });

  it("does not collapse rows without a dedupe key", () => {
    const rows = [
      notification({ id: "one", dedupe_key: null }),
      notification({ id: "two", dedupe_key: "   " }),
    ];

    expect(dedupeNotifications(rows).map((row) => row.id)).toEqual(["one", "two"]);
  });

  it("counts unread notifications using the same dedupe semantics", () => {
    const rows = [
      notification({ id: "newest", dedupe_key: "swap:1:accepted", is_read: false }),
      notification({ id: "older", dedupe_key: "swap:1:accepted", is_read: false }),
      notification({ id: "unique", dedupe_key: "swap:2:accepted", is_read: false }),
    ];

    expect(countUnreadNotifications(rows)).toBe(2);
  });
});
