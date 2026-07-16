"use client";

import { useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { nanoid } from "nanoid";
import type { SharedDeps } from "./shared-deps";
import { isSafetyReportReason } from "../safety/reportBlockPolicy";
import { setUserBlock, submitSafetyReport } from "../safety/reportBlockService";

export function useSafetyActions(
  deps: Pick<
    SharedDeps,
    | "user"
    | "dataSource"
    | "supabase"
    | "setLastError"
    | "setNotifications"
    | "sendAuditLog"
  > & {
    setBlockedUsers: Dispatch<SetStateAction<string[]>>;
  },
) {
  const {
    user,
    dataSource,
    supabase,
    setLastError,
    setNotifications,
    setBlockedUsers,
  } = deps;

  useEffect(() => {
    let cancelled = false;

    const hydrateBlocks = async () => {
      if (dataSource !== "supabase" || !supabase || !user?.id) {
        setBlockedUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from("blocked_users")
        .select("blocked_id")
        .eq("blocker_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setLastError(error.message);
        setBlockedUsers([]);
        return;
      }

      setBlockedUsers(
        Array.from(
          new Set(
            (data ?? [])
              .map((row) => row.blocked_id)
              .filter((id): id is string => typeof id === "string"),
          ),
        ),
      );
    };

    void hydrateBlocks();
    return () => {
      cancelled = true;
    };
  }, [dataSource, setBlockedUsers, setLastError, supabase, user?.id]);

  const reportUser = useCallback(
    async (params: {
      reportedUserId: string;
      reportedItemId?: string;
      reason: string;
      description?: string;
    }): Promise<void> => {
      if (!user?.id) throw new Error("Authentication required");
      if (!isSafetyReportReason(params.reason)) {
        throw new Error("Invalid report reason");
      }
      setLastError(null);

      if (dataSource === "supabase") {
        if (!supabase) throw new Error("Supabase client unavailable");

        const result = await submitSafetyReport(supabase, {
          targetType: params.reportedItemId ? "item" : "user",
          targetId: params.reportedItemId ?? params.reportedUserId,
          reason: params.reason,
          description: params.description ?? "",
          idempotencyKey: `report:${nanoid()}`,
        });

        if (!result.ok) {
          setLastError(result.error.message);
          throw new Error(result.error.message);
        }
      }
    },
    [dataSource, setLastError, supabase, user?.id],
  );

  const changeBlock = useCallback(
    async (targetUserId: string, blocked: boolean): Promise<void> => {
      if (!user?.id) throw new Error("Authentication required");
      if (!targetUserId) throw new Error("Target user is required");
      setLastError(null);

      if (dataSource === "supabase") {
        if (!supabase) throw new Error("Supabase client unavailable");

        const result = await setUserBlock(supabase, {
          targetUserId,
          blocked,
          idempotencyKey: `${blocked ? "block" : "unblock"}:${nanoid()}`,
        });

        if (!result.ok) {
          setLastError(result.error.message);
          throw new Error(result.error.message);
        }

        if (result.data.blocked !== blocked) {
          const error = "Block state did not match the requested state";
          setLastError(error);
          throw new Error(error);
        }
      }

      setBlockedUsers((previous) => {
        if (blocked) {
          return previous.includes(targetUserId)
            ? previous
            : [...previous, targetUserId];
        }
        return previous.filter((id) => id !== targetUserId);
      });
    },
    [dataSource, setBlockedUsers, setLastError, supabase, user?.id],
  );

  const blockUser = useCallback(
    (targetUserId: string) => changeBlock(targetUserId, true),
    [changeBlock],
  );

  const unblockUser = useCallback(
    (targetUserId: string) => changeBlock(targetUserId, false),
    [changeBlock],
  );

  const markNotificationRead = useCallback(
    async (notificationId: string) => {
      if (!notificationId) return;
      setLastError(null);
      if (dataSource === "supabase" && supabase) {
        const { error } = await supabase
          .from("notifications")
          .update({ read: true })
          .eq("id", notificationId);
        if (error) setLastError(error.message);
      }
      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification,
        ),
      );
    },
    [dataSource, setLastError, setNotifications, supabase],
  );

  const clearNotifications = useCallback(
    () => setNotifications([]),
    [setNotifications],
  );

  return {
    reportUser,
    blockUser,
    unblockUser,
    markNotificationRead,
    clearNotifications,
  };
}
