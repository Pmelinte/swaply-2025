// src/features/items/types.ts

export type ItemCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor";

export interface ItemImage {
  id?: string;
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  isPrimary?: boolean;
}

export interface ItemAiMetadata {
  // ✅ câmpuri folosite de UI (item-form.tsx)
  model?: string;
  primaryLabel?: string;
  suggestedTitle?: string;
  suggestedCategory?: string;
  suggestedSubcategory?: string;
  suggestedTags?: string[];

  // ✅ compat + fallback
  confidence?: number; // 0..1
  raw?: Record<string, unknown>;

  // (păstrăm și vechile chei dacă mai sunt prin alte părți)
  detectedTitle?: string;
  detectedCategory?: string;
  detectedSubcategory?: string;
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

  status?: string;

  locationCity: string;
  locationCountry: string;

  approximateValue?: number;
  currency?: string;

  images: ItemImage[];

  aiMetadata?: ItemAiMetadata;

  isActive?: boolean;

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
