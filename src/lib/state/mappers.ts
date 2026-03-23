/**
 * Data mappers — transform Supabase rows into typed app objects.
 * Pure functions extracted from state.tsx for modularity.
 */
import { nanoid } from "nanoid";
import type {
  ChatMessage,
  Item,
  LanguageCode,
  Notification,
  SwapIntent,
  UserProfile,
} from "../types";
import {
  safeArray,
  safeBoolean,
  safeLocationType,
  safeNotificationPriority,
  safeObject,
  safeString,
  safeSwapStatus,
  safeBadgeTier,
} from "./helpers";

type MutableRef<T> = { current: T };

export function createMapProfile(userRef: MutableRef<UserProfile | null>) {
  return (data: Partial<UserProfile> & Record<string, unknown>): UserProfile => {
    const currentUser = userRef.current;
    return {
      id: safeString(
        data.id,
        safeString(data.user_id, safeString(data.uid, nanoid())),
      ),
      email: safeString(data.email, currentUser?.email ?? ""),
      username: safeString(data.username, currentUser?.username),
      fullName: safeString(data.full_name, safeString(data.fullName, currentUser?.fullName)),
      displayName: safeString(
        data.display_name,
        safeString(data.displayName, "Utilizator Swaply"),
      ),
      firstName: safeString(data.first_name, safeString(data.full_name, safeString(data.firstName))),
      avatarUrl: safeString(data.avatar_url, safeString(data.avatarUrl)),
      bio: safeString(data.bio, safeString(data.about_me)),
      languages: safeArray<LanguageCode>(
        data.languages,
        currentUser?.languages ?? ["ro"],
      ),
      badge: safeBadgeTier(data.badge, currentUser?.badge ?? "free"),
      role: (data.role === "admin" || data.role === "moderator") ? data.role as "admin" | "moderator" : "user",
      location:
        (safeObject(
          data.location,
          currentUser?.location ?? {},
        ) as UserProfile["location"]) ||
        (data.city || data.region || data.country
          ? {
              country: safeString(data.country),
              region: safeString(data.region),
              city: safeString(data.city),
              postalCode: safeString(data.postal_code),
              travelRadiusKm:
                typeof data.travel_radius_km === "number"
                  ? data.travel_radius_km
                  : currentUser?.location?.travelRadiusKm,
            }
          : currentUser?.location),
      visibility:
        safeObject(
          data.visibility,
          currentUser?.visibility ?? {
            publicProfile: true,
            itemsVisibility: "public",
            showExactLocation: false,
            showLastSeen: true,
          },
        ) as UserProfile["visibility"],
      notifications:
        safeObject(
          data.notifications,
          currentUser?.notifications ?? {
            email: true,
            push: true,
            chat: true,
            matches: true,
            swapUpdates: true,
          },
        ) as UserProfile["notifications"],
      swapPreferences:
        safeObject(
          data.swap_preferences,
          currentUser?.swapPreferences ?? {
            logistics: "flexible",
            notes: "",
          },
        ) as UserProfile["swapPreferences"],
      security:
        safeObject(
          data.security,
          currentUser?.security ?? {
            twoFactorEnabled: false,
            method: null,
            passkeysEnabled: false,
          },
        ) as UserProfile["security"],
      stats:
        safeObject(
          data.stats,
          currentUser?.stats ?? {
            tokens: 0,
            reputation: "starter",
            completedSwaps: 0,
            activeListings: 0,
          },
        ) as UserProfile["stats"],
      createdAt: safeString(data.created_at, safeString(data.createdAt as string | undefined)),
    };
  };
}

export function createMapItem(userRef: MutableRef<UserProfile | null>) {
  return (row: Partial<Item> & Record<string, unknown>): Item => {
    const currentUser = userRef.current;
    const aiMeta = safeObject(row.ai_metadata, {}) as Record<string, unknown>;
    // DB images is JSONB array of URLs; app photos is string[]
    const imagesRaw = row.images ?? row.photos;
    const photosList = Array.isArray(imagesRaw)
      ? (imagesRaw as (string | { url?: string })[]).map((img) =>
          typeof img === "string" ? img : safeString((img as Record<string, unknown>)?.url),
        ).filter(Boolean)
      : [];
    return {
      id: safeString(row.id, nanoid()),
      ownerId: safeString(
        row.owner_id,
        safeString(row.ownerId, currentUser?.id ?? "unknown"),
      ),
      title: safeString(row.title, "Obiect fără titlu"),
      category: safeString(row.category, "General"),
      condition: (safeString(row.condition, "good") as Item["condition"]) ?? "good",
      description: safeString(row.description),
      wishlist: safeString(row.wishlist, safeString(aiMeta.wishlist)),
      status: (safeString(row.status, "active") as Item["status"]) ?? "active",
      isDemo: safeBoolean(row.is_demo, false),
      isActive: safeBoolean(row.is_active, true),
      createdAt: safeString(row.created_at, new Date().toISOString()),
      location: safeString(row.location, safeString(row.location_city, safeString(row.city))),
      aiSuggestedTags: safeArray<string>(row.tags, safeArray<string>(row.ai_suggested_tags, row.aiSuggestedTags ?? [])),
      userFinalTags: safeArray<string>(row.tags, safeArray<string>(row.user_final_tags, row.userFinalTags ?? [])),
      photos: photosList as string[],
      intent: (safeString(aiMeta.intent) || undefined) as Item["intent"],
      flexibility: (safeString(aiMeta.flexibility) || undefined) as Item["flexibility"],
      perceivedValue: (safeString(aiMeta.perceivedValue) || undefined) as Item["perceivedValue"],
      acceptsBundle: typeof aiMeta.acceptsBundle === "boolean" ? aiMeta.acceptsBundle : undefined,
      recipientMatters: typeof aiMeta.recipientMatters === "boolean" ? aiMeta.recipientMatters : undefined,
      clarity: (safeString(aiMeta.clarity) || undefined) as Item["clarity"],
      context: (safeString(aiMeta.context) || undefined) as Item["context"],
      aiNote: safeString(aiMeta.aiNote) || undefined,
    };
  };
}

export function createMapMessage() {
  return (row: Partial<ChatMessage> & Record<string, unknown>): ChatMessage => {
    const attachments = safeArray<Record<string, unknown>>(row.attachments, [])
      .map((att) => ({
        id: safeString(att.id, nanoid()),
        name: safeString(att.name, "attachment"),
        safe: safeBoolean(att.safe, true),
      }))
      .filter((att) => typeof att.name === "string" && typeof att.safe === "boolean");

    return {
      id: safeString(row.id, nanoid()),
      // DB uses conversation_id (text) or swap_id (uuid) — both map to conversationId
      conversationId: safeString(row.conversation_id, safeString(row.swap_id, safeString(row.conversationId))),
      senderId: safeString(row.sender_id, safeString(row.senderId)),
      recipientId: safeString(row.recipient_id, safeString(row.recipientId)) || undefined,
      content: safeString(row.content),
      createdAt: safeString(row.created_at, safeString(row.createdAt, new Date().toISOString())),
      isRead: safeBoolean(row.is_read, false),
      translated: safeBoolean(row.translated, false),
      attachments,
      moderated: safeBoolean(row.moderated, false),
      messageType: safeString(row.message_type, safeString(row.messageType, "text")) as ChatMessage["messageType"],
      locationData: row.location_data && typeof row.location_data === "object" ? (row.location_data as ChatMessage["locationData"]) : undefined,
      reactions: row.reactions ? safeObject(row.reactions, {}) as ChatMessage["reactions"] : undefined,
      readBy: safeArray<string>(row.read_by, safeArray<string>(row.readBy, [])),
    };
  };
}

export function createMapSwapIntent() {
  return (row: Partial<SwapIntent> & Record<string, unknown>): SwapIntent => {
    const logistics = safeObject(row.logistics, {}) as Record<string, unknown>;
    const feedbackRaw =
      row.feedback && typeof row.feedback === "object"
        ? (safeObject(row.feedback, {}) as Record<string, unknown>)
        : null;
    const feedback =
      feedbackRaw && typeof feedbackRaw.rating === "number"
        ? { rating: feedbackRaw.rating, comment: safeString(feedbackRaw.comment) }
        : undefined;
    return {
      id: safeString(row.id, nanoid()),
      requesterId: safeString(row.requester_id, safeString(row.requesterId)),
      responderId: safeString(row.responder_id, safeString(row.responderId)),
      // DB `swaps` table uses offered_item_id / requested_item_id
      requesterItemId: safeString(
        row.offered_item_id,
        safeString(row.requester_item_id, safeString(row.requesterItemId)),
      ),
      responderItemId: safeString(
        row.requested_item_id,
        safeString(row.responder_item_id, safeString(row.responderItemId)),
      ),
      status: safeSwapStatus(row.status, "pending"),
      logistics: {
        locationType: safeLocationType(logistics.locationType),
        meetupPoint: safeString(logistics.meetupPoint),
        courierTracking: safeString(logistics.courierTracking),
      },
      notifications: safeArray<string>(row.notifications, []),
      feedback,
      requesterConfirmed: safeBoolean(row.requester_confirmed, safeBoolean(row.requesterConfirmed, false)),
      responderConfirmed: safeBoolean(row.responder_confirmed, safeBoolean(row.responderConfirmed, false)),
      dispute: row.dispute && typeof row.dispute === "object" ? row.dispute as SwapIntent["dispute"] : undefined,
      createdAt: safeString(row.created_at, safeString(row.createdAt)),
      updatedAt: safeString(row.updated_at, safeString(row.updatedAt)),
    };
  };
}

export function createMapNotification() {
  return (row: Partial<Notification> & Record<string, unknown>): Notification => {
    // DB uses title+body; app uses message. Combine for display.
    const title = safeString(row.title);
    const body = safeString(row.body);
    const message = safeString(row.message) || (title && body ? `${title}: ${body}` : title || body);
    return {
      id: safeString(row.id, nanoid()),
      userId: safeString(row.user_id, safeString(row.userId)),
      type: safeString(row.type, "info"),
      title: title || undefined,
      message,
      body: body || undefined,
      data: (row.data && typeof row.data === "object" ? row.data : {}) as Record<string, unknown>,
      // DB uses is_read; app uses read
      read: safeBoolean(row.is_read, safeBoolean(row.read, false)),
      priority: safeNotificationPriority(row.priority, "info"),
      createdAt: safeString(row.created_at, safeString(row.createdAt, new Date().toISOString())),
    };
  };
}
