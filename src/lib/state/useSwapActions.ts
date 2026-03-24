"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import type { SwapIntent, SwapType } from "../types";
import type { SharedDeps } from "./shared-deps";
import { showTokenToast } from "@/components/tokens/TokenToast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { trackItemEvent } from "@/lib/item-analytics";

export function useSwapActions(deps: Pick<SharedDeps, "user" | "dataSource" | "supabase" | "setLastError" | "mapSwapIntent" | "swaps" | "setSwaps" | "items" | "setNotifications" | "sendAuditLog" | "trackEvent">) {
  const { user, dataSource, supabase, setLastError, mapSwapIntent, swaps, setSwaps, items, setNotifications, sendAuditLog, trackEvent } = deps;

  const proposeSwap = useCallback(
    async ({ requesterItemId, responderItemId, responderId, swapType, requesterBundleIds, responderBundleIds }: {
      requesterItemId: string; responderItemId: string; responderId: string;
      swapType?: SwapType; requesterBundleIds?: string[]; responderBundleIds?: string[];
    }) => {
      if (!user?.id || !requesterItemId || !responderItemId || !responderId || responderId === user.id) return null;
      setLastError(null);

      const logistics: SwapIntent["logistics"] = {
        locationType: user.swapPreferences.logistics === "courier" ? "courier" : "public_spot",
      };

      if (dataSource === "supabase" && supabase) {
        const [reqAvail, resAvail] = await Promise.all([
          supabase.rpc("is_item_available", { item_uuid: requesterItemId }),
          supabase.rpc("is_item_available", { item_uuid: responderItemId }),
        ]);
        if (reqAvail.data === false) {
          setLastError("Obiectul tău nu mai este disponibil");
          return null;
        }
        if (resAvail.data === false) {
          setLastError("Obiectul nu mai este disponibil");
          return null;
        }

        const { data, error } = await supabase.from("swaps")
          .insert({ requester_id: user.id, responder_id: responderId,
            offered_item_id: requesterItemId, requested_item_id: responderItemId,
            status: "pending", logistics, notifications: ["Propunere swap trimisă."],
            updated_at: new Date().toISOString() })
          .select("*").maybeSingle();
        if (error) { setLastError(error.message); return null; }
        if (!data) return null;
        const mapped = mapSwapIntent(data);
        setSwaps((prev) => [mapped, ...prev.filter((s) => s.id !== mapped.id)]);
        // Track analytics for both items
        trackItemEvent(responderItemId, "swap_proposed", user.id);
        trackItemEvent(requesterItemId, "swap_proposed", user.id);
        // Mark onboarding step_first_swap
        supabase.from("onboarding_progress").upsert(
          { user_id: user.id, step_first_swap: true },
          { onConflict: "user_id" },
        ).then(({ error: obErr }) => {
          if (obErr) console.error("[onboarding] step_first_swap error:", obErr.message);
        });
        return mapped;
      }

      // Mark onboarding step_first_swap
      const sb = getSupabaseClient();
      if (sb) {
        sb.from("onboarding_progress").upsert(
          { user_id: user.id, step_first_swap: true },
          { onConflict: "user_id" },
        ).then(({ error: obErr }) => {
          if (obErr) console.error("[onboarding] step_first_swap error:", obErr.message);
        });
      }

      const now = new Date().toISOString();
      const localSwap: SwapIntent = {
        id: nanoid(), requesterId: user.id, responderId, requesterItemId, responderItemId,
        swapType: swapType ?? "object", requesterBundleIds, responderBundleIds,
        status: "pending", logistics, notifications: ["Propunere swap trimisă."], createdAt: now, updatedAt: now,
      };
      setSwaps((prev) => [localSwap, ...prev]);

      const reqItem = items.find((i) => i.id === requesterItemId);
      const resItem = items.find((i) => i.id === responderItemId);
      setNotifications((prev) => [{
        id: `swap-new-${localSwap.id}`, userId: user.id, type: "swap_proposed",
        message: `Propunere de schimb trimisă: ${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"}`,
        read: false, priority: "info", createdAt: now,
      }, ...prev]);
      return localSwap;
    },
    [dataSource, items, mapSwapIntent, supabase, user, setLastError, setSwaps, setNotifications],
  );

  const updateSwapStatus = useCallback(
    async (swapId: string, status: SwapIntent["status"]) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((s) => s.id === swapId);
      const previousStatus = existing?.status;
      const nextNotifications = [...(existing?.notifications ?? []), `Status actualizat: ${status}`];

      // Optimistic update
      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status, notifications: nextNotifications } : s));

      if (dataSource === "supabase" && supabase) {
        try {
          // Call server-side state machine for validated transition
          const session = await supabase.auth.getSession();
          const accessToken = session.data.session?.access_token;

          const res = await fetch("/api/swaps/transition", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ swapId, toStatus: status }),
          });

          const result = await res.json();
          if (!res.ok) {
            // Rollback optimistic update
            setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: previousStatus ?? s.status, notifications: existing?.notifications ?? s.notifications } : s));
            setLastError(result.error ?? "Transition failed");
            return;
          }

          // Apply server-confirmed data
          if (result.swap) {
            const mapped = mapSwapIntent(result.swap);
            setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s));
          }
        } catch (err) {
          // Rollback on network error
          setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: previousStatus ?? s.status, notifications: existing?.notifications ?? s.notifications } : s));
          setLastError(err instanceof Error ? err.message : "Network error");
          return;
        }

        sendAuditLog({ userId: user?.id ?? "", action: "swap.status_changed", entityType: "swap", entityId: swapId, oldData: { status: previousStatus }, newData: { status } });
        // Track accepted/completed analytics
        if (status === "accepted" || status === "completed") {
          const evType = status === "accepted" ? "swap_accepted" as const : "swap_completed" as const;
          if (existing?.requesterItemId) trackItemEvent(existing.requesterItemId, evType, user?.id);
          if (existing?.responderItemId) trackItemEvent(existing.responderItemId, evType, user?.id);
        }
        return;
      }

      // Mock/local fallback — no server validation
      sendAuditLog({ userId: user?.id ?? "", action: "swap.status_changed", entityType: "swap", entityId: swapId, oldData: { status: previousStatus }, newData: { status } });
      // Track accepted/completed analytics (mock path)
      if (status === "accepted" || status === "completed") {
        const evType = status === "accepted" ? "swap_accepted" as const : "swap_completed" as const;
        if (existing?.requesterItemId) trackItemEvent(existing.requesterItemId, evType, user?.id);
        if (existing?.responderItemId) trackItemEvent(existing.responderItemId, evType, user?.id);
      }

      const statusMessages: Record<string, string> = {
        accepted: "Schimbul a fost acceptat!",
        rejected: "Schimbul a fost refuzat.",
        completed: "Schimbul a fost finalizat cu succes!",
        cancelled: "Schimbul a fost anulat.",
        expired: "Schimbul a expirat.",
      };
      if (statusMessages[status]) {
        const reqItem = items.find((i) => i.id === existing?.requesterItemId);
        const resItem = items.find((i) => i.id === existing?.responderItemId);
        setNotifications((prev) => [{
          id: `swap-${swapId}-${status}-${Date.now()}`, userId: user?.id ?? "", type: "swap_update",
          message: `${statusMessages[status]} (${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"})`,
          read: false,
          priority: status === "completed" ? "success" : status === "cancelled" ? "warning" : "info",
          createdAt: new Date().toISOString(),
        }, ...prev]);
      }
      if (status === "completed") {
        showTokenToast(30, "complete_swap");
      }
    },
    [dataSource, items, mapSwapIntent, sendAuditLog, supabase, swaps, user?.id, setLastError, setSwaps, setNotifications],
  );

  const addSwapFeedback = useCallback(
    async (swapId: string, rating: number, comment: string) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((s) => s.id === swapId);
      const nextNot = [...(existing?.notifications ?? []), "Feedback trimis."];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("swaps")
          .update({ feedback: { rating, comment }, notifications: nextNot, updated_at: new Date().toISOString() })
          .eq("id", swapId).select("*").maybeSingle();
        if (error) { setLastError(error.message); return; }
        if (data) { const mapped = mapSwapIntent(data); setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s)); }
        return;
      }
      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, feedback: { rating, comment }, notifications: nextNot } : s));
    },
    [dataSource, mapSwapIntent, supabase, swaps, setLastError, setSwaps],
  );

  const updateSwapLogistics = useCallback(
    async (swapId: string, logistics: SwapIntent["logistics"]) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((s) => s.id === swapId);
      const nextNot = [...(existing?.notifications ?? []), `Logistics updated: ${logistics.locationType}`];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase.from("swaps")
          .update({ logistics, notifications: nextNot, updated_at: new Date().toISOString() })
          .eq("id", swapId).select("*").maybeSingle();
        if (error) { setLastError(error.message); return; }
        if (data) { const mapped = mapSwapIntent(data); setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s)); }
        return;
      }
      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, logistics, notifications: nextNot } : s));
    },
    [dataSource, mapSwapIntent, supabase, swaps, setLastError, setSwaps],
  );

  const confirmDelivery = useCallback(async (swapId: string, side: "requester" | "responder") => {
    if (!user?.id) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    const field = side === "requester" ? "requesterConfirmed" : "responderConfirmed";
    const otherConfirmed = side === "requester" ? swap.responderConfirmed : swap.requesterConfirmed;

    // Determine which delivery status to transition to
    const isFirstDelivery = !swap.requesterConfirmed && !swap.responderConfirmed;
    const deliveryStatus = isFirstDelivery ? "delivered_by_a" : "delivered_by_b";

    const updated = { ...swap, [field]: true };
    if (otherConfirmed) {
      updated.status = "completed";
      updated.notifications = [...updated.notifications, "Ambele părți au confirmat. Schimb finalizat!"];
    } else {
      updated.notifications = [...updated.notifications, `${side === "requester" ? "Solicitantul" : "Partenerul"} a confirmat predarea.`];
    }

    setSwaps((prev) => prev.map((s) => s.id === swapId ? updated : s));

    if (dataSource === "supabase" && supabase) {
      const dbField = side === "requester" ? "requester_confirmed" : "responder_confirmed";
      await supabase.from("swaps").update({
        [dbField]: true,
        notifications: updated.notifications,
        updated_at: new Date().toISOString(),
      }).eq("id", swapId);

      // Use server-side state machine for the status transition
      const targetStatus = otherConfirmed ? "completed" : deliveryStatus;
      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;
        await fetch("/api/swaps/transition", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ swapId, toStatus: targetStatus }),
        });
      } catch {
        // confirmation fields saved, status transition logged as best-effort
      }
    }

    trackEvent("swap_delivery_confirmed", { swapId, side });
    if (otherConfirmed) trackEvent("swap_auto_completed", { swapId });
  }, [user?.id, swaps, dataSource, supabase, trackEvent, setSwaps]);

  const fileDispute = useCallback(async (
    swapId: string,
    reason: "item_not_received" | "wrong_item" | "damaged" | "condition_mismatch" | "no_show" | "other",
    description: string,
    photos?: string[],
  ) => {
    if (!user?.id) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    const dispute: NonNullable<SwapIntent["dispute"]> = {
      filedBy: user.id,
      reason,
      description,
      evidencePhotos: photos ?? [],
      status: "open",
      filedAt: new Date().toISOString(),
    };

    const updated = {
      ...swap,
      status: "disputed" as const,
      dispute,
      notifications: [...swap.notifications, `Dispută deschisă: ${reason}`],
    };

    setSwaps((prev) => prev.map((s) => s.id === swapId ? updated : s));

    if (dataSource === "supabase" && supabase) {
      try {
        const session = await supabase.auth.getSession();
        const accessToken = session.data.session?.access_token;

        // Use the new disputes API which handles both dispute creation and swap transition
        const res = await fetch("/api/disputes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            swapId,
            reason,
            description,
            evidence: (photos ?? []).map((url: string) => ({ evidenceType: "photo", content: url })),
          }),
        });

        if (!res.ok) {
          // Fallback: save dispute data directly + use transition API
          await supabase.from("swaps").update({
            dispute,
            notifications: updated.notifications,
            updated_at: new Date().toISOString(),
          }).eq("id", swapId);

          await fetch("/api/swaps/transition", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({ swapId, toStatus: "disputed" }),
          });
        }
      } catch {
        // Fallback: save directly to swaps table
        await supabase?.from("swaps").update({
          dispute,
          notifications: updated.notifications,
          updated_at: new Date().toISOString(),
        }).eq("id", swapId);
      }
    }

    setNotifications((prev) => [{
      id: `dispute-${swapId}-${Date.now()}`,
      userId: user.id,
      type: "dispute_filed",
      message: `Dispută deschisă pentru schimbul ${swap.requesterItemId.slice(0, 8)}`,
      read: false,
      priority: "warning",
      createdAt: new Date().toISOString(),
    }, ...prev]);

    trackEvent("dispute_filed", { swapId, reason });
  }, [user, swaps, dataSource, supabase, trackEvent, setSwaps, setNotifications]);

  return { proposeSwap, updateSwapStatus, addSwapFeedback, updateSwapLogistics, confirmDelivery, fileDispute };
}
