"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/state";
import type {
  SafetyReportAction,
  SafetyReportStatus,
} from "@/lib/safety/reportBlockPolicy";
import { resolveSafetyReport } from "@/lib/safety/reportBlockService";

/**
 * Admin moderation actions. Canonical report resolution is database-owned;
 * unrelated manual user and item administration remains server-routed.
 */
export function useAdminActions() {
  const { user } = useAppState();

  const logAudit = useCallback(
    async (
      action: string,
      entityType: string,
      entityId: string,
      newData?: Record<string, unknown>,
    ) => {
      if (!user?.id) return;
      fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action,
          entityType,
          entityId,
          newData,
        }),
      }).catch(() => {});
    },
    [user?.id],
  );

  const adminUserAction = useCallback(
    async (payload: Record<string, unknown>): Promise<{ error?: string }> => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return response.ok ? {} : { error: result.error ?? "Admin action failed" };
    },
    [],
  );

  const resolveReport = useCallback(
    async (params: {
      reportId: string;
      expectedStatus: Extract<SafetyReportStatus, "open" | "investigating">;
      action: SafetyReportAction;
      notes: string;
    }): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No Supabase client" };

      const result = await resolveSafetyReport(supabase, {
        reportId: params.reportId,
        expectedStatus: params.expectedStatus,
        action: params.action,
        notes: params.notes,
        idempotencyKey: `resolve-report:${nanoid()}`,
      });

      return result.ok ? {} : { error: result.error.message };
    },
    [],
  );

  const suspendUser = useCallback(
    async (
      targetUserId: string,
      days: number,
      reason: string,
    ): Promise<{ error?: string }> => {
      return adminUserAction({
        action: "suspend",
        userId: targetUserId,
        days,
        reason,
      });
    },
    [adminUserAction],
  );

  const banUser = useCallback(
    async (
      targetUserId: string,
      reason: string,
    ): Promise<{ error?: string }> => {
      return adminUserAction({
        action: "ban",
        userId: targetUserId,
        reason,
      });
    },
    [adminUserAction],
  );

  const unbanUser = useCallback(
    async (targetUserId: string): Promise<{ error?: string }> => {
      return adminUserAction({
        action: "unban",
        userId: targetUserId,
      });
    },
    [adminUserAction],
  );

  const changeBadge = useCallback(
    async (
      targetUserId: string,
      badge: string,
    ): Promise<{ error?: string }> => {
      return adminUserAction({
        action: "set_badge",
        userId: targetUserId,
        badge,
      });
    },
    [adminUserAction],
  );

  const toggleItemActive = useCallback(
    async (
      itemId: string,
      isActive: boolean,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No Supabase client" };

      const { error } = await supabase
        .from("items")
        .update({
          is_active: isActive,
          status: isActive ? "active" : "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) return { error: error.message };

      await logAudit(
        isActive ? "activate_item" : "hide_item",
        "item",
        itemId,
        { is_active: isActive },
      );
      return {};
    },
    [logAudit],
  );

  const deleteItem = useCallback(
    async (itemId: string): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No Supabase client" };

      const { error } = await supabase
        .from("items")
        .update({
          is_active: false,
          status: "archived",
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) return { error: error.message };

      await logAudit("delete_item", "item", itemId);
      return {};
    },
    [logAudit],
  );

  const toggleItemDemo = useCallback(
    async (
      itemId: string,
      isDemo: boolean,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No Supabase client" };

      const { error } = await supabase
        .from("items")
        .update({ is_demo: isDemo, updated_at: new Date().toISOString() })
        .eq("id", itemId);

      if (error) return { error: error.message };

      await logAudit("toggle_demo", "item", itemId, { is_demo: isDemo });
      return {};
    },
    [logAudit],
  );

  return {
    resolveReport,
    suspendUser,
    banUser,
    unbanUser,
    changeBadge,
    toggleItemActive,
    deleteItem,
    toggleItemDemo,
  };
}
