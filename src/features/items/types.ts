// src/features/items/types.ts

export type ItemCondition = "new" | "like_new" | "good" | "fair" | "poor";

export interface ItemImage {
  id?: string;            // poate lipsi la legacy/manual
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  isPrimary?: boolean;
}

/**
 * Compat layer: AI metadata poate veni din mai multe surse și evoluează.
 * Acceptăm chei suplimentare ca să nu rupem build-ul la fiecare mică schimbare.
 */
export type ItemAiMetadata = {
  model?: string;
  primaryLabel?: string;

  suggestedTitle?: string;
  suggestedCategory?: string;
  suggestedSubcategory?: string;
  suggestedTags?: string[];

  detectedTitle?: string;
  detectedCategory?: string;
  detectedSubcategory?: string;

  confidence?: number; // 0..1

  raw?: Record<string, unknown>;

  [key: string]: unknown;
};

export interface Item {
  id: string;
  ownerId: string;

  title: string;
  description: string;

  category: string;
  subcategory?: string;

  tags: string[];

  condition: ItemCondition;

  status?: string;     // compat cu swipe/feed vechi
  isActive?: boolean;  // compat (unele mappere vechi nu-l setează)

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images: ItemImage[];
  aiMetadata?: ItemAiMetadata;

  createdAt: string;
  updatedAt: string;
}

export interface ItemCreateInput {
  title: string;
  description: string;

  category: string;
  subcategory?: string;

  tags?: string[];

  condition: ItemCondition;

  status?: string;
  isActive?: boolean;

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images?: ItemImage[];
  aiMetadata?: ItemAiMetadata;
}

export interface ItemUpdateInput extends Partial<ItemCreateInput> {
  isActive?: boolean;
}

export type ItemFormData = ItemCreateInput;
