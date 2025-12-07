// src/features/items/server/items-repository.ts

import { createServerClient } from "@/lib/supabase/server";
import type { Item } from "@/features/items/types";

export const itemsRepository = {
  async listOffered(userId: string): Promise<Item[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("owner_id", userId)
      .eq("type", "offered")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listOffered error:", error);
      return [];
    }

    return data ?? [];
  },

  async listDesired(userId: string): Promise<Item[]> {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("owner_id", userId)
      .eq("type", "desired")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("listDesired error:", error);
      return [];
    }

    return data ?? [];
  },

  async updateItem(itemId: string, updates: Partial<Item>) {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("items")
      .update(updates)
      .eq("id", itemId);

    if (error) {
      console.error("updateItem error:", error);
      throw new Error("Nu am putut actualiza obiectul.");
    }
  },

  async archiveItem(itemId: string) {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("items")
      .update({ archived: true })
      .eq("id", itemId);

    if (error) {
      console.error("archiveItem error:", error);
      throw new Error("Nu am putut arhiva obiectul.");
    }
  },

  async deleteItem(itemId: string) {
    const supabase = createServerClient();

    const { error } = await supabase
      .from("items")
      .delete()
      .eq("id", itemId);

    if (error) {
      console.error("deleteItem error:", error);
      throw new Error("Nu am putut șterge obiectul.");
    }
  },
};
