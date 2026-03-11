"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SharedDeps } from "./shared-deps";

export function useSafetyActions(deps: Pick<SharedDeps, "user" | "dataSource" | "supabase" | "setLastError" | "sendAuditLog" | "setNotifications"> & {
  setBlockedUsers: Dispatch<SetStateAction<string[]>>;
}) {
  const { user, dataSource, supabase, setLastError, sendAuditLog, setNotifications, setBlockedUsers } = deps;

  const reportUser = useCallback(
    async (params: { reportedUserId: string; reportedItemId?: string; reason: string; description?: string }) => {
      if (!user?.id) return;
      setLastError(null);
      if (dataSource === "supabase" && supabase) {
        const entityType = params.reportedItemId ? "item" : "user";
        const entityId = params.reportedItemId ?? params.reportedUserId;
        const payload: Record<string, unknown> = {
          reporter_id: user.id, entity_type: entityType, entity_id: entityId,
          reason: params.reason, description: params.description ?? "", status: "pending",
        };
        const { error } = await supabase.from("reports").insert(payload);
        if (error) setLastError(error.message);
        sendAuditLog({ userId: user.id, action: "user.reported", entityType: "user", entityId: params.reportedUserId, newData: { reason: params.reason, reportedItemId: params.reportedItemId } });
      }
    },
    [dataSource, sendAuditLog, supabase, user, setLastError],
  );

  const blockUser = useCallback(async (targetUserId: string) => {
    if (!user?.id || !targetUserId) return;
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      const { error } = await supabase.from("blocked_users").insert({ blocker_id: user.id, blocked_id: targetUserId });
      if (error) setLastError(error.message);
    }
    setBlockedUsers((prev) => [...prev, targetUserId]);
    sendAuditLog({ userId: user?.id ?? "", action: "user.blocked", entityType: "user", entityId: targetUserId });
  }, [dataSource, sendAuditLog, supabase, user, setLastError, setBlockedUsers]);

  const unblockUser = useCallback(async (targetUserId: string) => {
    if (!user?.id || !targetUserId) return;
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      const { error } = await supabase.from("blocked_users").delete().eq("blocker_id", user.id).eq("blocked_id", targetUserId);
      if (error) setLastError(error.message);
    }
    setBlockedUsers((prev) => prev.filter((id) => id !== targetUserId));
  }, [dataSource, supabase, user, setLastError, setBlockedUsers]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!notificationId) return;
    setLastError(null);
    if (dataSource === "supabase" && supabase) {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
      if (error) setLastError(error.message);
    }
    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
  }, [dataSource, supabase, setLastError, setNotifications]);

  const clearNotifications = useCallback(() => setNotifications([]), [setNotifications]);

  return { reportUser, blockUser, unblockUser, markNotificationRead, clearNotifications };
}
