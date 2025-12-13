// src/features/notifications/types.ts

/**
 * Notifications (MVP)
 *
 * Scop:
 * - să avem un model stabil pentru notificări interne (in-app),
 * - extensibil pentru email/SMS mai târziu,
 * - fără să legăm acum implementarea de un provider extern.
 */

export type NotificationEvent =
  | "new_message"
  | "offer_proposed"
  | "swap_confirmed"
  | "swap_status_changed"
  | "wishlist_updated"
  | "system";

export type NotificationChannel = "in_app" | "email" | "sms";

export type NotificationStatus = "unread" | "read" | "archived";

/**
 * Model normalizat folosit în UI/API (camelCase).
 * În DB probabil vei avea snake_case (user_id, created_at, etc.)
 */
export type Notification = {
  id: string;

  userId: string;

  event: NotificationEvent;
  channel: NotificationChannel;

  title: string;
  body: string | null;

  /**
   * payload: metadate pentru deep link / context.
   * Exemplu:
   *  - { matchId: "...", messageId: "..." }
   *  - { itemId: "...", action: "added" }
   */
  payload: Record<string, any> | null;

  status: NotificationStatus;

  createdAt: string;
  readAt: string | null;
};

/**
 * Input pentru creare notificare (server-side).
 */
export type CreateNotificationInput = {
  userId: string;

  event: NotificationEvent;
  channel?: NotificationChannel; // default: in_app

  title: string;
  body?: string | null;

  payload?: Record<string, any> | null;
};

/**
 * Input pentru mark-read / archive (API).
 */
export type MarkNotificationInput = {
  id: string;
};

export type ListNotificationsQuery = {
  status?: NotificationStatus; // default: unread
  limit?: number; // default: 50
};

/**
 * API responses (pentru /api/notifications)
 */
export type NotificationsApiResponse =
  | { ok: true; notifications: Notification[]; unreadCount?: number }
  | { ok: false; error: string };