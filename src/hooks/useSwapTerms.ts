"use client";

import { useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  SwapHouseTerms,
  SwapServiceTerms,
  SwapEvent,
} from "@/lib/types";

/** Helpers for persisting house/service swap terms and audit events. */
export function useSwapTerms() {
  const saveHouseTerms = useCallback(
    async (
      swapId: string,
      terms: Omit<SwapHouseTerms, "id" | "swapId" | "createdAt">
    ) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      const { data, error } = await supabase
        .from("swap_house_terms")
        .upsert(
          {
            swap_id: swapId,
            property_type: terms.propertyType,
            rooms: terms.rooms,
            rules: terms.rules,
            interval_start: terms.intervalStart,
            interval_end: terms.intervalEnd,
            simultaneous: terms.simultaneous,
            inventory: terms.inventory,
            emergency_contact: terms.emergencyContact,
            inspection_notes: terms.inspectionNotes,
          },
          { onConflict: "swap_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SwapHouseTerms;
    },
    []
  );

  const saveServiceTerms = useCallback(
    async (
      swapId: string,
      terms: Omit<SwapServiceTerms, "id" | "swapId" | "createdAt">
    ) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      const { data, error } = await supabase
        .from("swap_service_terms")
        .upsert(
          {
            swap_id: swapId,
            skill: terms.skill,
            level: terms.level,
            delivery_mode: terms.deliveryMode,
            milestones: terms.milestones,
            portfolio_url: terms.portfolioUrl,
            estimated_hours: terms.estimatedHours,
          },
          { onConflict: "swap_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data as unknown as SwapServiceTerms;
    },
    []
  );

  const getSwapTerms = useCallback(
    async (swapId: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      const [houseRes, serviceRes, eventsRes] = await Promise.all([
        supabase
          .from("swap_house_terms")
          .select("*")
          .eq("swap_id", swapId)
          .maybeSingle(),
        supabase
          .from("swap_service_terms")
          .select("*")
          .eq("swap_id", swapId)
          .maybeSingle(),
        supabase
          .from("swap_events")
          .select("*")
          .eq("swap_id", swapId)
          .order("created_at", { ascending: true }),
      ]);

      if (houseRes.error) throw houseRes.error;
      if (serviceRes.error) throw serviceRes.error;
      if (eventsRes.error) throw eventsRes.error;

      return {
        houseTerms: houseRes.data as unknown as SwapHouseTerms | null,
        serviceTerms: serviceRes.data as unknown as SwapServiceTerms | null,
        events: (eventsRes.data ?? []) as unknown as SwapEvent[],
      };
    },
    []
  );

  const logSwapEvent = useCallback(
    async (
      swapId: string,
      action: string,
      fromStatus?: string,
      toStatus?: string,
      metadata?: Record<string, unknown>
    ) => {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase not configured");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("swap_events").insert({
        swap_id: swapId,
        actor_id: user.id,
        action,
        from_status: fromStatus,
        to_status: toStatus,
        metadata: metadata ?? {},
      });

      if (error) throw error;
    },
    []
  );

  return { saveHouseTerms, saveServiceTerms, getSwapTerms, logSwapEvent };
}
