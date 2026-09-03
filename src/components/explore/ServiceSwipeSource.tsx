"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { DomainSwipeDiscovery } from "./DomainSwipeDiscovery";

/** Read canonical service metadata for Swipe without changing the legacy catalogue. */
export function ServiceSwipeSource({ viewerId, viewerCity, query }: { viewerId?: string; viewerCity?: string; query: string }) {
  const [rows, setRows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setFailed(false);
      try {
        const client = getSupabaseClient();
        if (!client) throw new Error("unavailable");
        const { data, error } = await client.from("services_listings")
          .select("id,item_id,owner_id,status,service_name,category_l1,delivery_mode,available_days,available_date_from,available_date_until,swap_wants_description,gallery,items(title,image_url,images,description,location_city,is_demo,is_active,status)")
          .eq("status", "active").order("created_at", { ascending: false }).limit(500).abortSignal(controller.signal);
        if (error) throw error;
        if (!controller.signal.aborted) setRows(data ?? []);
      } catch {
        if (!controller.signal.aborted) { setRows([]); setFailed(true); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return <DomainSwipeDiscovery key={viewerId ?? "guest"} domain="services" rows={rows} query={query} loading={loading} failed={failed} onRetry={retry} viewerId={viewerId} viewerCity={viewerCity} />;
}
