import type { Item } from "@/lib/types";

export const OWNER_EDITABLE_ITEM_FIELDS = [
  "title",
  "description",
  "category",
  "condition",
  "location",
  "wishlist",
  "status",
  "isActive",
  "photos",
  "aiSuggestedTags",
  "userFinalTags",
  "intent",
  "flexibility",
  "perceivedValue",
  "clarity",
  "context",
  "acceptsBundle",
  "recipientMatters",
  "conditionImpact",
  "aiNote",
] as const;

export type ItemLifecycleStatus = Extract<Item["status"], "active" | "paused" | "archived">;

const LIFECYCLE_STATUSES = new Set<ItemLifecycleStatus>(["active", "paused", "archived"]);

export function isItemLifecycleStatus(status: string): status is ItemLifecycleStatus {
  return LIFECYCLE_STATUSES.has(status as ItemLifecycleStatus);
}

export function itemLifecyclePatch(status: ItemLifecycleStatus): {
  status: ItemLifecycleStatus;
  is_active: boolean;
  updated_at: string;
} {
  return {
    status,
    is_active: status === "active",
    updated_at: new Date().toISOString(),
  };
}

export function itemEditPayload(item: Item, ownerId: string): Record<string, unknown> {
  const photos = item.photos ?? [];
  return {
    id: item.id,
    owner_id: ownerId,
    title: item.title,
    category: item.category,
    condition: item.condition,
    description: item.description,
    status: item.status,
    is_active: item.isActive ?? item.status === "active",
    is_demo: item.isDemo ?? false,
    location: item.location,
    tags: item.userFinalTags ?? item.aiSuggestedTags ?? [],
    images: photos,
    image_url: photos[0] ?? null,
    wishlist: item.wishlist ?? null,
    ai_metadata: {
      intent: item.intent ?? null,
      flexibility: item.flexibility ?? null,
      perceivedValue: item.perceivedValue ?? null,
      clarity: item.clarity ?? null,
      context: item.context ?? null,
      acceptsBundle: item.acceptsBundle ?? false,
      recipientMatters: item.recipientMatters ?? false,
      conditionImpact: item.conditionImpact ?? [],
      aiNote: item.aiNote ?? null,
      wishlist: item.wishlist ?? null,
    },
    updated_at: new Date().toISOString(),
  };
}

export function publicItemSelect(): string {
  return [
    "id",
    "owner_id",
    "title",
    "description",
    "category",
    "condition",
    "location",
    "images",
    "image_url",
    "wishlist",
    "tags",
    "ai_suggested_tags",
    "user_final_tags",
    "status",
    "is_active",
    "is_demo",
    "created_at",
    "ai_metadata",
  ].join(", ");
}
