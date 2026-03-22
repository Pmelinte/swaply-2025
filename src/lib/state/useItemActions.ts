"use client";

import { useCallback } from "react";
import type { Item } from "../types";
import { createEmptyItem } from "../mock-data";
import type { SharedDeps } from "./shared-deps";
import { showTokenToast } from "@/components/tokens/TokenToast";
import { getSupabaseClient } from "@/lib/supabase/client";

export function useItemActions(deps: Pick<SharedDeps, "user" | "dataSource" | "supabase" | "setLastError" | "mapItem" | "items" | "setItems">) {
  const { user, dataSource, supabase, setLastError, mapItem, items, setItems } = deps;

  const upsertItem = useCallback(
    async (item: Item) => {
      const isNew = !items.some((i) => i.id === item.id);
      const previousItem = items.find((i) => i.id === item.id);
      setItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) { const next = [...prev]; next[idx] = item; return next; }
        return [item, ...prev];
      });

      if (dataSource === "supabase" && supabase && user?.id) {
        const payload = {
          id: item.id, owner_id: user.id, title: item.title,
          category: item.category, condition: item.condition,
          description: item.description,
          status: item.status === "traded" ? "traded" : item.status,
          is_active: item.isActive ?? true,
          is_demo: item.isDemo ?? false, location: item.location,
          tags: item.userFinalTags ?? item.aiSuggestedTags ?? [],
          images: (item.photos ?? []).map((url: string) => url),
          image_url: (item.photos ?? [])[0] ?? null,
          ai_metadata: {
            intent: item.intent ?? null, flexibility: item.flexibility ?? null,
            perceivedValue: item.perceivedValue ?? null, clarity: item.clarity ?? null,
            context: item.context ?? null, acceptsBundle: item.acceptsBundle ?? false,
            recipientMatters: item.recipientMatters ?? false,
            conditionImpact: item.conditionImpact ?? [], aiNote: item.aiNote ?? null,
            wishlist: item.wishlist ?? null,
          },
          updated_at: new Date().toISOString(),
        };

        const query = item.id
          ? supabase.from("items").upsert(payload).select().maybeSingle()
          : supabase.from("items").insert(payload).select().maybeSingle();

        const { data, error } = await query;
        if (error) {
          setLastError(error.message);
          if (isNew) {
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          } else if (previousItem) {
            setItems((prev) => prev.map((i) => i.id === item.id ? previousItem : i));
          }
          return null;
        }
        if (data) {
          const mapped = mapItem(data);
          setItems((prev) => {
            const idx = prev.findIndex((i) => i.id === mapped.id);
            if (idx >= 0) { const next = [...prev]; next[idx] = mapped; return next; }
            return [mapped, ...prev];
          });
          return mapped;
        }
      }
      if (isNew && !item.isDemo) {
        showTokenToast(10, "add_item");
        // Mark onboarding step_first_item
        const sb = getSupabaseClient();
        if (sb && user?.id) {
          sb.from("onboarding_progress").upsert(
            { user_id: user.id, step_first_item: true },
            { onConflict: "user_id" },
          ).then(({ error: obErr }) => {
            if (obErr) console.error("[onboarding] step_first_item error:", obErr.message);
          });
        }
      }
      return item;
    },
    [dataSource, items, mapItem, supabase, user, setItems, setLastError],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const previousItems = items;
      setItems((prev) => prev.filter((i) => i.id !== id));

      if (dataSource === "supabase" && supabase) {
        const { error } = await supabase
          .from("items")
          .update({ is_active: false, status: "archived", updated_at: new Date().toISOString() })
          .eq("id", id);
        if (error) {
          setLastError(error.message);
          setItems(previousItems);
        }
      }
    },
    [dataSource, items, supabase, setItems, setLastError],
  );

  const duplicateItem = useCallback(async (id: string) => {
    const source = items.find((i) => i.id === id);
    if (!source || !user?.id) return null;
    const copy: Item = { ...source, id: crypto.randomUUID(), title: `${source.title} (copy)`,
      status: "active", isActive: true, createdAt: new Date().toISOString() };
    return upsertItem(copy);
  }, [items, upsertItem, user]);

  const setItemStatus = useCallback(async (id: string, status: Item["status"]) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await upsertItem({ ...item, status, isActive: status === "active" });
  }, [items, upsertItem]);

  const startNewItem = useCallback(() => {
    if (!user) return null;
    const item = createEmptyItem(user.id);
    if (user.location?.city) item.location = user.location.city;
    return item;
  }, [user]);

  return { upsertItem, deleteItem, duplicateItem, setItemStatus, startNewItem };
}
