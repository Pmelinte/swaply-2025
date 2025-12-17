// src/features/items/types.ts

export type ItemCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor";

export interface ItemImage {
  // optional: la imagini „manual/legacy” nu avem id
  id?: string;
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  isPrimary?: boolean;
}

export interface ItemAiMetadata {
  detectedTitle?: string;
  detectedCategory?: string;
  detectedSubcategory?: string;
  confidence?: number; // 0..1
  raw?: Record<string, unknown>;
}

export interface Item {
  id: string;

  ownerId: string;

  title: string;
  description: string;

  category: string;
  subcategory?: string;

  tags: string[];

  condition: ItemCondition;

  // ✅ compat pentru swipe/feed-uri mai vechi
  status?: string;

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images: ItemImage[];

  aiMetadata?: ItemAiMetadata;

  isActive: boolean;

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

  // opțional, pentru compat cu payload-uri existente
  status?: string;

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images?: ItemImage[];
  aiMetadata?: ItemAiMetadata;

  isActive?: boolean;
}

export interface ItemUpdateInput extends Partial<ItemCreateInput> {
  isActive?: boolean;
}

export type ItemFormData = ItemCreateInput;
