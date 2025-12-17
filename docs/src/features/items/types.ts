// src/features/items/types.ts

export type ItemCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor";

export interface ItemImage {
  id: string;
  url: string;
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
  raw?: Record<string, unknown>; // fallback safe, nu rupem build-ul
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

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images: ItemImage[];

  aiMetadata?: ItemAiMetadata;

  isActive: boolean;

  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface ItemCreateInput {
  title: string;
  description: string;

  category: string;
  subcategory?: string;

  tags?: string[];

  condition: ItemCondition;

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images?: ItemImage[];
}

export interface ItemUpdateInput extends Partial<ItemCreateInput> {
  isActive?: boolean;
}
