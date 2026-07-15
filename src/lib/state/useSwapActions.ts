"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import type { SwapIntent, SwapType } from "../types";
import type { SharedDeps } from "./shared-deps";
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
        trackItemEvent(responderItemId, "swap_proposed", user.id);
        trackItemEvent(requesterItemId, "swap_proposed", user.id);

        const reqItem = items.find((i) => i.id === requesterItemId);
        fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: responderId,
            title: "New swap proposal!",
            body: `${user.displayName || "Someone"} wants to swap "${reqItem?.title || "an item"}" with you`,
            url: `/change?swap=${mapped.id}`,
          }),
        }).catch(() => { /* push is best-effort */ });
        supabase.from("onboarding_progress").upsert(
          { user_id: user.id, step_first_swap: true },
          { onConflict: "user_id" },
        ).then(({ error: obErr }) => {
          if (obErr) console.error("[onboarding] step_first_swap error:", obErr.message);
        });
        return mapped;
      }

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

      if (status === "completed") {
        setLastError("Completion requires a separate confirmation from both participants.");
        return;
      }

      const existing = swaps.find((s) => s.id === swapId);
      const previousStatus = existing?.status;
      const nextNotifications = [...(existing?.notifications ?? []), `Status actualizat: ${status}`];

      setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status, notifications: nextNotifications } : s));

      if (dataSource === "supabase" && supabase) {
        try {
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
            setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: previousStatus ?? s.status, notifications: existing?.notifications ?? s.notifications } : s));
            setLastError(result.error ?? "Transition failed");
            return;
          }

          if (result.swap) {
            const mapped = mapSwapIntent(result.swap);
            setSwaps((prev) => prev.map((s) => s.id === swapId ? mapped : s));
          }
        } catch (err) {
          setSwaps((prev) => prev.map((s) => s.id === swapId ? { ...s, status: previousStatus ?? s.status, notifications: existing?.notifications ?? s.notifications } : s));
          setLastError(err instanceof Error ? err.message : "Network error");
          return;
        }

        sendAuditLog({ userId: user?.id ?? "", action: "swap.status_changed", entityType: "swap", entityId: swapId, oldData: { status: previousStatus }, newData: { status } });
        if (status === "accepted") {
          if (existing?.requesterItemId) trackItemEvent(existing.requesterItemId, "swap_accepted", user?.id);
          if (existing?.responderItemId) trackItemEvent(existing.responderItemId, "swap_accepted", user?.id);
        }
        return;
      }

      sendAuditLog({ userId: user?.id ?? "", action: "swap.status_changed", entityType: "swap", entityId: swapId, oldData: { status: previousStatus }, newData: { status } });
      if (status === "accepted") {
        if (existing?.requesterItemId) trackItemEvent(existing.requesterItemId, "swap_accepted", user?.id);
        if (existing?.responderItemId) trackItemEvent(existing.responderItemId, "swap_accepted", user?.id);
      }

      const statusMessages: Record<string, string> = {
        accepted: "Schimbul a fost acceptat!",
        rejected: "Schimbul a fost refuzat.",
        cancelled: "Schimbul a fost anulat.",
        expired: "Schimbul a expirat.",
      };
      if (statusMessages[status]) {
        const reqItem = items.find((i) => i.id === existing?.requesterItemId);
        const resItem = items.find((i) => i.id === existing?.responderItemId);
        setNotifications((prev) => [{
          id: `swap-${swapId}-${status}-${Date.now()}`, userId: user?.id ?? "", type: "swap_update",
          message: `${statusMessages[status]} (${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"})`,
          read: false, priority: status === "cancelled" ? "warning" : "info",
          createdAt: new Date().toISOString(),
        }, ...prev]);
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

  const confirmDelivery = useCallback(async (swapId: string, _side: "requester" | "responder") => {
    if (!user?.id) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    setLastError(null);

    if (dataSource === "supabase") {
      const idempotencyKey = `completion:${swapId}:${user.id}:delivery`;
      try {
        const response = await fetch(`/api/swaps/${encodeURIComponent(swapId)}/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "idempotency-key": idempotencyKey,
          },
          body: JSON.stringify({ idempotencyKey }),
        });
        const result = await response.json();
        if (!response.ok) {
          setLastError(result.error ?? "Completion confirmation failed");
          return;
        }

        if (result.swap) {
          const mapped = mapSwapIntent(result.swap);
          setSwaps((prev) => prev.map((entry) => entry.id === swapId ? mapped : entry));
        }

        trackEvent("swap_delivery_confirmed", {
          swapId,
          actorId: user.id,
          bothConfirmed: Boolean(result.both_confirmed),
          replayed: Boolean(result.replayed),
        });
        return;
      } catch (error) {
        setLastError(error instanceof Error ? error.message : "Network error");
        return;
      }
    }

    const isRequester = swap.requesterId === user.id;
    const isResponder = swap.responderId === user.id;
    if (!isRequester && !isResponder) {
      setLastError("Only swap participants may confirm completion.");
      return;
    }

    const updated = {
      ...swap,
      requesterConfirmed: swap.requesterConfirmed || isRequester,
      responderConfirmed: swap.responderConfirmed || isResponder,
    };
    if (updated.requesterConfirmed && updated.responderConfirmed) {
      updated.status = "completed";
    }
    setSwaps((prev) => prev.map((entry) => entry.id === swapId ? updated : entry));
    trackEvent("swap_delivery_confirmed", { swapId, actorId: user.id, bothConfirmed: updated.status === "completed" });
  }, [user?.id, swaps, dataSource, mapSwapIntent, trackEvent, setLastError, setSwaps]);

  const fileDispute = useCallback(async (
    swapId: string,
    reason: "item_not_received" | "wrong_item" | "damaged" | "condition_mismatch" | "no_show" | "other",
    description: string,
    photos?: string[],
  ) => {
    if (!user?.id) return;
    const swap = swaps.find((s) => s.id === swapId);
    if (!swap) return;

    setLastError(null);

    if (dataSource === "supabase" && supabase) {
      const idempotencyKey = `dispute:${swapId}:${user.id}`;
      try {
        const res = await fetch("/api/disputes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "idempotency-key": idempotencyKey,
          },
          body: JSON.stringify({
            swapId,
            expectedStatus: swap.status,
            reason,
            description,
            evidence: (photos ?? []).map((url: string) => ({
              evidenceType: "photo",
              content: url,
            })),
            idempotencyKey,
          }),
        });

        const result = await res.json();
        if (!res.ok) {
          setLastError(result.error ?? "Dispute opening failed");
          return;
        }

        if (result.swap) {
          const mapped = mapSwapIntent(result.swap);
          setSwaps((prev) => prev.map((entry) => entry.id === swapId ? mapped : entry));
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
        trackEvent("dispute_filed", {
          swapId,
          reason,
          replayed: Boolean(result.replayed),
        });
        return;
      } catch (error) {
        setLastError(error instanceof Error ? error.message : "Network error");
        return;
      }
    }

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
    setSwaps((prev) => prev.map((entry) => entry.id === swapId ? updated : entry));
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
  }, [user, swaps, dataSource, supabase, mapSwapIntent, trackEvent, setLastError, setSwaps, setNotifications]);

  return { proposeSwap, updateSwapStatus, addSwapFeedback, updateSwapLogistics, confirmDelivery, fileDispute };
}
