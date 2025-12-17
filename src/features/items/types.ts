// src/features/items/types.ts

export type ItemCondition = "new" | "like_new" | "good" | "fair" | "poor";

export interface ItemImage {
  id?: string;
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  isPrimary?: boolean;
}

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

  confidence?: number;
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

  status?: string;
  isActive?: boolean;

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
