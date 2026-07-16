"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { nanoid } from "nanoid";
import type { SharedDeps } from "./shared-deps";
import type { SafetyReportReason } from "../safety/reportBlockPolicy";
import { setUserBlock, submitSafetyReport } from "../safety/reportBlockService";

type SafetyActionResult = { error?: string };

export function useSafetyActions(
  deps: Pick<
    SharedDeps,
    "user" | "dataSource" | "supabase" | "setLastError" | "setNotifications"
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

  const reportUser = useCallback(
    async (params: {
      reportedUserId: string;
      reportedItemId?: string;
      reason: SafetyReportReason;
      description?: string;
    }): Promise<SafetyActionResult> => {
      if (!user?.id) return { error: "Authentication required" };
      setLastError(null);

      if (dataSource === "supabase") {
        if (!supabase) return { error: "Supabase client unavailable" };

        const result = await submitSafetyReport(supabase, {
          targetType: params.reportedItemId ? "item" : "user",
          targetId: params.reportedItemId ?? params.reportedUserId,
          reason: params.reason,
          description: params.description ?? "",
          idempotencyKey: `report:${nanoid()}`,
        });

        if (!result.ok) {
          setLastError(result.error.message);
          return { error: result.error.message };
        }
      }

      return {};
    },
    [dataSource, setLastError, supabase, user],
  );

  const changeBlock = useCallback(
    async (targetUserId: string, blocked: boolean): Promise<SafetyActionResult> => {
      if (!user?.id) return { error: "Authentication required" };
      if (!targetUserId) return { error: "Target user is required" };
      setLastError(null);

      if (dataSource === "supabase") {
        if (!supabase) return { error: "Supabase client unavailable" };

        const result = await setUserBlock(supabase, {
          targetUserId,
          blocked,
          idempotencyKey: `${blocked ? "block" : "unblock"}:${nanoid()}`,
        });

        if (!result.ok) {
          setLastError(result.error.message);
          return { error: result.error.message };
        }

        if (result.data.blocked !== blocked) {
          const error = "Block state did not match the requested state";
          setLastError(error);
          return { error };
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

      return {};
    },
    [dataSource, setBlockedUsers, setLastError, supabase, user],
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
