"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import type { SwapIntent, SwapType } from "../types";
import type { SharedDeps } from "./shared-deps";
import { showTokenToast } from "@/components/tokens/TokenToast";
import { getSupabaseClient } from "@/lib/supabase/client";
import { trackItemEvent } from "@/lib/item-analytics";
import { isSwapStatus } from "@/lib/swaps/lifecycle";
import { transitionSwapFromClient } from "@/lib/swaps/transitionClient";

export function useSwapActions(
  deps: Pick<
    SharedDeps,
    | "user"
    | "dataSource"
    | "supabase"
    | "setLastError"
    | "mapSwapIntent"
    | "swaps"
    | "setSwaps"
    | "items"
    | "setNotifications"
    | "sendAuditLog"
    | "trackEvent"
  >,
) {
  const {
    user,
    dataSource,
    supabase,
    setLastError,
    mapSwapIntent,
    swaps,
    setSwaps,
    items,
    setNotifications,
    sendAuditLog,
    trackEvent,
  } = deps;

  const proposeSwap = useCallback(
    async ({
      requesterItemId,
      responderItemId,
      responderId,
      swapType,
      requesterBundleIds,
      responderBundleIds,
    }: {
      requesterItemId: string;
      responderItemId: string;
      responderId: string;
      swapType?: SwapType;
      requesterBundleIds?: string[];
      responderBundleIds?: string[];
    }) => {
      if (
        !user?.id ||
        !requesterItemId ||
        !responderItemId ||
        !responderId ||
        responderId === user.id
      ) {
        return null;
      }
      setLastError(null);

      const logistics: SwapIntent["logistics"] = {
        locationType:
          user.swapPreferences.logistics === "courier"
            ? "courier"
            : "public_spot",
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

        const { data, error } = await supabase
          .from("swaps")
          .insert({
            requester_id: user.id,
            responder_id: responderId,
            offered_item_id: requesterItemId,
            requested_item_id: responderItemId,
            status: "pending",
            logistics,
            notifications: ["Propunere swap trimisă."],
            updated_at: new Date().toISOString(),
          })
          .select("*")
          .maybeSingle();
        if (error) {
          setLastError(error.message);
          return null;
        }
        if (!data) return null;
        const mapped = mapSwapIntent(data);
        setSwaps((prev) => [
          mapped,
          ...prev.filter((swap) => swap.id !== mapped.id),
        ]);
        trackItemEvent(responderItemId, "swap_proposed", user.id);
        trackItemEvent(requesterItemId, "swap_proposed", user.id);

        const reqItem = items.find((item) => item.id === requesterItemId);
        fetch("/api/push/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: responderId,
            title: "New swap proposal!",
            body: `${user.displayName || "Someone"} wants to swap "${reqItem?.title || "an item"}" with you`,
            url: `/change?swap=${mapped.id}`,
          }),
        }).catch(() => {
          // Push remains best-effort.
        });

        supabase
          .from("onboarding_progress")
          .upsert(
            { user_id: user.id, step_first_swap: true },
            { onConflict: "user_id" },
          )
          .then(({ error: onboardingError }) => {
            if (onboardingError) {
              console.error(
                "[onboarding] step_first_swap error:",
                onboardingError.message,
              );
            }
          });
        return mapped;
      }

      const browserClient = getSupabaseClient();
      if (browserClient) {
        browserClient
          .from("onboarding_progress")
          .upsert(
            { user_id: user.id, step_first_swap: true },
            { onConflict: "user_id" },
          )
          .then(({ error: onboardingError }) => {
            if (onboardingError) {
              console.error(
                "[onboarding] step_first_swap error:",
                onboardingError.message,
              );
            }
          });
      }

      const now = new Date().toISOString();
      const localSwap: SwapIntent = {
        id: nanoid(),
        requesterId: user.id,
        responderId,
        requesterItemId,
        responderItemId,
        swapType: swapType ?? "object",
        requesterBundleIds,
        responderBundleIds,
        status: "pending",
        logistics,
        notifications: ["Propunere swap trimisă."],
        createdAt: now,
        updatedAt: now,
      };
      setSwaps((prev) => [localSwap, ...prev]);

      const reqItem = items.find((item) => item.id === requesterItemId);
      const resItem = items.find((item) => item.id === responderItemId);
      setNotifications((prev) => [
        {
          id: `swap-new-${localSwap.id}`,
          userId: user.id,
          type: "swap_proposed",
          message: `Propunere de schimb trimisă: ${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"}`,
          read: false,
          priority: "info",
          createdAt: now,
        },
        ...prev,
      ]);
      return localSwap;
    },
    [
      dataSource,
      items,
      mapSwapIntent,
      setLastError,
      setNotifications,
      setSwaps,
      supabase,
      user,
    ],
  );

  const updateSwapStatus = useCallback(
    async (swapId: string, status: SwapIntent["status"]) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((swap) => swap.id === swapId);
      const previousStatus = existing?.status;

      if (
        !existing ||
        !isSwapStatus(previousStatus) ||
        !isSwapStatus(status)
      ) {
        setLastError("Unsupported global swap status");
        return;
      }

      const nextNotifications = [
        ...(existing.notifications ?? []),
        `Status actualizat: ${status}`,
      ];

      setSwaps((prev) =>
        prev.map((swap) =>
          swap.id === swapId
            ? { ...swap, status, notifications: nextNotifications }
            : swap,
        ),
      );

      if (dataSource === "supabase" && supabase) {
        try {
          const result = await transitionSwapFromClient(supabase, {
            swapId,
            expectedStatus: previousStatus,
            toStatus: status,
          });

          const mapped = mapSwapIntent(result.swap);
          setSwaps((prev) =>
            prev.map((swap) => (swap.id === swapId ? mapped : swap)),
          );

          if (result.transition.outcome === "applied") {
            sendAuditLog({
              userId: user?.id ?? "",
              action: "swap.status_changed",
              entityType: "swap",
              entityId: swapId,
              oldData: { status: previousStatus },
              newData: { status },
            });

            if (status === "accepted" || status === "completed") {
              const eventType =
                status === "accepted" ? "swap_accepted" : "swap_completed";
              if (existing.requesterItemId) {
                trackItemEvent(
                  existing.requesterItemId,
                  eventType,
                  user?.id,
                );
              }
              if (existing.responderItemId) {
                trackItemEvent(
                  existing.responderItemId,
                  eventType,
                  user?.id,
                );
              }
            }
          }
        } catch (error) {
          setSwaps((prev) =>
            prev.map((swap) =>
              swap.id === swapId
                ? {
                    ...swap,
                    status: previousStatus,
                    notifications: existing.notifications,
                  }
                : swap,
            ),
          );
          setLastError(
            error instanceof Error ? error.message : "Network error",
          );
        }
        return;
      }

      sendAuditLog({
        userId: user?.id ?? "",
        action: "swap.status_changed",
        entityType: "swap",
        entityId: swapId,
        oldData: { status: previousStatus },
        newData: { status },
      });
      if (status === "accepted" || status === "completed") {
        const eventType =
          status === "accepted" ? "swap_accepted" : "swap_completed";
        if (existing.requesterItemId) {
          trackItemEvent(existing.requesterItemId, eventType, user?.id);
        }
        if (existing.responderItemId) {
          trackItemEvent(existing.responderItemId, eventType, user?.id);
        }
      }

      const statusMessages: Record<string, string> = {
        accepted: "Schimbul a fost acceptat!",
        rejected: "Schimbul a fost refuzat.",
        completed: "Schimbul a fost finalizat cu succes!",
        cancelled: "Schimbul a fost anulat.",
        expired: "Schimbul a expirat.",
      };
      if (statusMessages[status]) {
        const reqItem = items.find(
          (item) => item.id === existing.requesterItemId,
        );
        const resItem = items.find(
          (item) => item.id === existing.responderItemId,
        );
        setNotifications((prev) => [
          {
            id: `swap-${swapId}-${status}-${Date.now()}`,
            userId: user?.id ?? "",
            type: "swap_update",
            message: `${statusMessages[status]} (${reqItem?.title ?? "?"} ↔ ${resItem?.title ?? "?"})`,
            read: false,
            priority:
              status === "completed"
                ? "success"
                : status === "cancelled"
                  ? "warning"
                  : "info",
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }
      if (status === "completed") {
        showTokenToast(30, "complete_swap");
      }
    },
    [
      dataSource,
      items,
      mapSwapIntent,
      sendAuditLog,
      setLastError,
      setNotifications,
      setSwaps,
      supabase,
      swaps,
      user?.id,
    ],
  );

  const addSwapFeedback = useCallback(
    async (swapId: string, rating: number, comment: string) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((swap) => swap.id === swapId);
      const nextNotifications = [
        ...(existing?.notifications ?? []),
        "Feedback trimis.",
      ];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("swaps")
          .update({
            feedback: { rating, comment },
            notifications: nextNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", swapId)
          .select("*")
          .maybeSingle();
        if (error) {
          setLastError(error.message);
          return;
        }
        if (data) {
          const mapped = mapSwapIntent(data);
          setSwaps((prev) =>
            prev.map((swap) => (swap.id === swapId ? mapped : swap)),
          );
        }
        return;
      }

      setSwaps((prev) =>
        prev.map((swap) =>
          swap.id === swapId
            ? {
                ...swap,
                feedback: { rating, comment },
                notifications: nextNotifications,
              }
            : swap,
        ),
      );
    },
    [
      dataSource,
      mapSwapIntent,
      setLastError,
      setSwaps,
      supabase,
      swaps,
    ],
  );

  const updateSwapLogistics = useCallback(
    async (swapId: string, logistics: SwapIntent["logistics"]) => {
      if (!swapId) return;
      setLastError(null);
      const existing = swaps.find((swap) => swap.id === swapId);
      const nextNotifications = [
        ...(existing?.notifications ?? []),
        `Logistics updated: ${logistics.locationType}`,
      ];

      if (dataSource === "supabase" && supabase) {
        const { data, error } = await supabase
          .from("swaps")
          .update({
            logistics,
            notifications: nextNotifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", swapId)
          .select("*")
          .maybeSingle();
        if (error) {
          setLastError(error.message);
          return;
        }
        if (data) {
          const mapped = mapSwapIntent(data);
          setSwaps((prev) =>
            prev.map((swap) => (swap.id === swapId ? mapped : swap)),
          );
        }
        return;
      }

      setSwaps((prev) =>
        prev.map((swap) =>
          swap.id === swapId
            ? { ...swap, logistics, notifications: nextNotifications }
            : swap,
        ),
      );
    },
    [
      dataSource,
      mapSwapIntent,
      setLastError,
      setSwaps,
      supabase,
      swaps,
    ],
  );

  const confirmDelivery = useCallback(
    async (swapId: string, side: "requester" | "responder") => {
      if (!user?.id) return;
      const swap = swaps.find((candidate) => candidate.id === swapId);
      if (!swap) return;

      const actualSide =
        swap.requesterId === user.id
          ? "requester"
          : swap.responderId === user.id
            ? "responder"
            : null;
      if (!actualSide || actualSide !== side) {
        setLastError("You are not allowed to confirm this side");
        return;
      }

      const field =
        side === "requester" ? "requesterConfirmed" : "responderConfirmed";
      const otherConfirmed =
        side === "requester"
          ? swap.responderConfirmed
          : swap.requesterConfirmed;
      const confirmationMessage = `${
        side === "requester" ? "Solicitantul" : "Partenerul"
      } a confirmat predarea.`;
      const finalMessage = "Ambele părți au confirmat. Schimb finalizat!";
      const notifications = [
        ...swap.notifications,
        otherConfirmed ? finalMessage : confirmationMessage,
      ];
      const locallyUpdated = {
        ...swap,
        [field]: true,
        notifications,
      };

      setSwaps((prev) =>
        prev.map((candidate) =>
          candidate.id === swapId ? locallyUpdated : candidate,
        ),
      );

      if (dataSource === "supabase" && supabase) {
        const dbField =
          side === "requester" ? "requester_confirmed" : "responder_confirmed";
        const { error } = await supabase
          .from("swaps")
          .update({
            [dbField]: true,
            notifications,
            updated_at: new Date().toISOString(),
          })
          .eq("id", swapId);

        if (error) {
          setLastError(error.message);
          setSwaps((prev) =>
            prev.map((candidate) =>
              candidate.id === swapId ? swap : candidate,
            ),
          );
          return;
        }

        if (
          otherConfirmed &&
          isSwapStatus(swap.status) &&
          (swap.status === "accepted" || swap.status === "in_progress")
        ) {
          try {
            const result = await transitionSwapFromClient(supabase, {
              swapId,
              expectedStatus: swap.status,
              toStatus: "completed",
            });
            const mapped = mapSwapIntent(result.swap);
            setSwaps((prev) =>
              prev.map((candidate) =>
                candidate.id === swapId ? mapped : candidate,
              ),
            );
            trackEvent("swap_auto_completed", { swapId });
          } catch (transitionError) {
            setLastError(
              transitionError instanceof Error
                ? transitionError.message
                : "Completion transition failed",
            );
          }
        }
      } else if (otherConfirmed) {
        setSwaps((prev) =>
          prev.map((candidate) =>
            candidate.id === swapId
              ? { ...locallyUpdated, status: "completed" }
              : candidate,
          ),
        );
        trackEvent("swap_auto_completed", { swapId });
      }

      trackEvent("swap_delivery_confirmed", { swapId, side });
    },
    [
      dataSource,
      mapSwapIntent,
      setLastError,
      setSwaps,
      supabase,
      swaps,
      trackEvent,
      user?.id,
    ],
  );

  const fileDispute = useCallback(
    async (
      swapId: string,
      reason:
        | "item_not_received"
        | "wrong_item"
        | "damaged"
        | "condition_mismatch"
        | "no_show"
        | "other",
      description: string,
      photos?: string[],
    ) => {
      if (!user?.id) return;
      const swap = swaps.find((candidate) => candidate.id === swapId);
      if (!swap) return;

      const dispute: NonNullable<SwapIntent["dispute"]> = {
        filedBy: user.id,
        reason,
        description,
        evidencePhotos: photos ?? [],
        status: "open",
        filedAt: new Date().toISOString(),
      };
      const notifications = [
        ...swap.notifications,
        `Dispută deschisă: ${reason}`,
      ];
      const locallyUpdated = {
        ...swap,
        status: "disputed" as const,
        dispute,
        notifications,
      };

      setSwaps((prev) =>
        prev.map((candidate) =>
          candidate.id === swapId ? locallyUpdated : candidate,
        ),
      );

      if (dataSource === "supabase" && supabase) {
        try {
          const session = await supabase.auth.getSession();
          const accessToken = session.data.session?.access_token;
          const response = await fetch("/api/disputes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken
                ? { Authorization: `Bearer ${accessToken}` }
                : {}),
            },
            body: JSON.stringify({
              swapId,
              reason,
              description,
              evidence: (photos ?? []).map((url) => ({
                evidenceType: "photo",
                content: url,
              })),
            }),
          });

          if (!response.ok) {
            await supabase
              .from("swaps")
              .update({
                dispute,
                notifications,
                updated_at: new Date().toISOString(),
              })
              .eq("id", swapId);

            if (
              isSwapStatus(swap.status) &&
              swap.status !== "disputed"
            ) {
              await transitionSwapFromClient(supabase, {
                swapId,
                expectedStatus: swap.status,
                toStatus: "disputed",
              });
            }
          }
        } catch {
          await supabase
            .from("swaps")
            .update({
              dispute,
              notifications,
              updated_at: new Date().toISOString(),
            })
            .eq("id", swapId);
        }
      }

      setNotifications((prev) => [
        {
          id: `dispute-${swapId}-${Date.now()}`,
          userId: user.id,
          type: "dispute_filed",
          message: `Dispută deschisă pentru schimbul ${swap.requesterItemId.slice(0, 8)}`,
          read: false,
          priority: "warning",
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      trackEvent("dispute_filed", { swapId, reason });
    },
    [
      dataSource,
      setLastError,
      setNotifications,
      setSwaps,
      supabase,
      swaps,
      trackEvent,
      user,
    ],
  );

  return {
    proposeSwap,
    updateSwapStatus,
    addSwapFeedback,
    updateSwapLogistics,
    confirmDelivery,
    fileDispute,
  };
}
