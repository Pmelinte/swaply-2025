"use client";

import { useCallback } from "react";
import type { Item } from "../types";
import { locales } from "@/i18n/config";
import { createEmptyItem } from "../mock-data";
import type { SharedDeps } from "./shared-deps";
import { showTokenToast } from "@/components/tokens/TokenToast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { itemEditPayload } from "@/lib/items/item-lifecycle";

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
        const payload = itemEditPayload(item, user.id);

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
          // Fire-and-forget: revalidate category caches if new item
          if (isNew) {
            fetch("/api/revalidate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tags: ["categories", "subcategories"] }),
            }).catch(() => {});
          }

          // Fire-and-forget: generate semantic embedding for this item
          fetch("/api/embeddings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: mapped.id }),
          }).catch(() => { /* embedding generation is non-critical */ });

          // Fire-and-forget: pre-translate to all locales from i18n config
          const targetLocales = (locales as readonly string[]).filter((l) => l !== "ro");
          const priorityLangs = new Set(["en", "de", "fr", "es", "it"]);
          // Priority languages first (immediate)
          for (const lang of targetLocales.filter((l) => priorityLangs.has(l))) {
            fetch("/api/translate/item", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ itemId: mapped.id, targetLocale: lang }),
            }).catch(() => {});
          }
          // Remaining languages after a delay (avoid rate limits)
          setTimeout(() => {
            for (const lang of targetLocales.filter((l) => !priorityLangs.has(l))) {
              fetch("/api/translate/item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: mapped.id, targetLocale: lang }),
              }).catch(() => {});
            }
          }, 5000);
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

          // Check wanted_requests for matching and notify
          if (item.category || item.title) {
            sb.from("wanted_requests")
              .select("id, user_id, title")
              .eq("status", "active")
              .neq("user_id", user.id)
              .ilike("category", `%${(item.category ?? "").replace(/[%_\\]/g, "\\$&")}%`)
              .limit(10)
              .then(({ data: wantedMatches }) => {
                if (wantedMatches && wantedMatches.length > 0) {
                  for (const wr of wantedMatches) {
                    sb.from("notifications").insert({
                      user_id: wr.user_id,
                      type: "wanted_item_listed",
                      title: "New item matches your request!",
                      message: `Someone listed "${item.title}" which matches your request "${wr.title}"`,
                      read: false,
                    }).then(({ error: nErr }) => {
                      if (nErr) console.error("[wanted-match] notification error:", nErr.message);
                    });
                  }
                }
              });
          }
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
        const response = await fetch(`/api/items/${id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "archived" }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setLastError(body?.error ?? "Failed to archive item");
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
    if (status === "active" || status === "paused" || status === "archived") {
      const previousItems = items;
      const nextItem = { ...item, status, isActive: status === "active" };
      setItems((prev) => prev.map((candidate) => (candidate.id === id ? nextItem : candidate)));
      const response = await fetch(`/api/items/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setLastError(body?.error ?? "Failed to update item status");
        setItems(previousItems);
      }
      return;
    }
    await upsertItem({ ...item, status, isActive: false });
  }, [items, setItems, setLastError, upsertItem]);

  const startNewItem = useCallback(() => {
    if (!user) return null;
    const item = createEmptyItem(user.id);
    if (user.location?.city) item.location = user.location.city;
    return item;
  }, [user]);

  return { upsertItem, deleteItem, duplicateItem, setItemStatus, startNewItem };
}
