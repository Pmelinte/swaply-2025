"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { DomainSwipeDiscovery } from "./DomainSwipeDiscovery";

/** Isolated public read: do not change AppState or the data used by Matching/map. */
export function ObjectSwipeSource({ viewerId, viewerCity, query }: { viewerId?: string; viewerCity?: string; query: string }) {
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
        const { data, error } = await client.from("items")
          .select("id,owner_id,title,category,condition,status,is_active,is_demo,item_type,images,image_url,location_city,swap_geo_preference,swap_wants_description")
          .eq("status", "active").eq("is_active", true)
          .or("item_type.eq.object,item_type.is.null")
          .order("created_at", { ascending: false }).limit(200).abortSignal(controller.signal);
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
  const retry = useMemo(() => () => setAttempt((value) => value + 1), []);
  return <DomainSwipeDiscovery key={viewerId ?? "guest"} domain="objects" rows={rows} query={query} loading={loading} failed={failed} onRetry={retry} viewerId={viewerId} viewerCity={viewerCity} />;
}
