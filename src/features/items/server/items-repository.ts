// src/features/items/server/items-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import { normalizeItemFormData } from "../../items/validation";
import type { Item, ItemFormData } from "../../items/types";

/**
 * Converteste un row din Supabase intr-un obiect Item complet
 */
const mapDbItem = (dbRow: any): Item => {
  return {
    id: dbRow.id,
    ownerId: dbRow.owner_id,

    title: dbRow.title,
    description: dbRow.description,

    category: dbRow.category,
    subcategory: dbRow.subcategory ?? undefined,

    tags: dbRow.tags ?? [],

    condition: dbRow.condition,
    status: dbRow.status,

    locationCity: dbRow.location_city ?? undefined,
    locationCountry: dbRow.location_country ?? undefined,

    approximateValue: dbRow.approximate_value ?? undefined,
    currency: dbRow.currency ?? undefined,

    images: dbRow.images ?? [],

    aiMetadata: dbRow.ai_metadata ?? undefined,

    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
};

export const itemsRepository = {
  /**
   * Creeaza un item nou in Supabase
   */
  async createItem(form: ItemFormData, userId: string): Promise<Item> {
    const supabase = createServerClient();
    const payload = {
      owner_id: userId,
      title: form.title,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      tags: form.tags,
      condition: form.condition,
      status: "active",
      location_city: form.locationCity,
      location_country: form.locationCountry,
      approximate_value: form.approximateValue,
      currency: form.currency,
      images: form.images,
      ai_metadata: form.aiMetadata,
    };

    const { data, error } = await supabase
      .from("items")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("createItem error:", error);
      throw new Error("Nu s-a putut crea obiectul.");
    }

    return mapDbItem(data);
  },

  /**
   * Actualizeaza un item existent
   * (doar daca apartine userului)
   */
  async updateItem(itemId: string, form: ItemFormData, userId: string): Promise<Item> {
    const supabase = createServerClient();
    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      tags: form.tags,
      condition: form.condition,
      location_city: form.locationCity,
      location_country: form.locationCountry,
      approximate_value: form.approximateValue,
      currency: form.currency,
      images: form.images,
      ai_metadata: form.aiMetadata,
    };

    const { data, error } = await supabase
      .from("items")
      .update(payload)
      .eq("id", itemId)
      .eq("owner_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("updateItem error:", error);
      throw new Error("Nu s-a putut actualiza obiectul.");
    }

    return mapDbItem(data);
  },

  /**
   * Seteaza status-ul itemului pe archived
   */
  async archiveItem(itemId: string, userId: string): Promise<void> {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("items")
      .update({ status: "archived" })
      .eq("id", itemId)
      .eq("owner_id", userId);

    if (error) {
      console.error("archiveItem error:", error);
      throw new Error("Nu s-a putut arhiva obiectul.");
    }
  },

  /**
   * Returneaza item-ul dupa ID
   */
  async getItemById(itemId: string): Promise<Item | null> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("id", itemId)
      .limit(1)
      .single();

    if (error) {
      console.error("getItemById error:", error);
      return null;
    }

    return mapDbItem(data);
  },

  /**
   * Lista obiectele unui user
   */
  async listUserItems(userId: string): Promise<Item[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listUserItems error:", error);
      throw new Error("Nu s-au putut încărca obiectele.");
    }

    return data.map(mapDbItem);
  },

  /**
   * Lista obiectele active din sistem (pentru feed / swipe)
   * TODO: Va primi filtre avansate in etapa Swipe Engine
   */
  async listActiveItems(): Promise<Item[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listActiveItems error:", error);
      throw new Error("Nu s-a putut încărca lista de obiecte active.");
    }

    return data.map(mapDbItem);
  },
};
