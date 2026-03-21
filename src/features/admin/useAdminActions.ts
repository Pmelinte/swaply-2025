"use client";

import { useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAppState } from "@/lib/state";

/**
 * Admin moderation actions — all actions log to audit_log.
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
    [user],
  );

  // ── Report Actions ──

  const updateReportStatus = useCallback(
    async (
      reportId: string,
      status: string,
      resolution?: string,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No supabase client" };

      const payload: Record<string, unknown> = { status };
      if (resolution) payload.resolution = resolution;
      if (status === "resolved" || status === "dismissed") {
        payload.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("abuse_reports")
        .update(payload)
        .eq("id", reportId);

      if (error) return { error: error.message };

      await logAudit("update_report", "report", reportId, payload);
      return {};
    },
    [logAudit],
  );

  // ── Moderation Actions ──

  const insertModerationAction = useCallback(
    async (params: {
      targetUserId: string;
      action: string;
      reason: string;
      reportId?: string;
      details?: Record<string, unknown>;
    }): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase || !user?.id) return { error: "Not authenticated" };

      const { error } = await supabase.from("moderation_actions").insert({
        admin_id: user.id,
        target_user_id: params.targetUserId,
        action: params.action,
        reason: params.reason,
        report_id: params.reportId ?? null,
        details: params.details ?? {},
      });

      if (error) return { error: error.message };

      await logAudit(params.action, "user", params.targetUserId, {
        reason: params.reason,
        reportId: params.reportId,
      });
      return {};
    },
    [logAudit, user],
  );

  // ── User Actions ──

  const warnUser = useCallback(
    async (
      targetUserId: string,
      reason: string,
      reportId?: string,
    ): Promise<{ error?: string }> => {
      return insertModerationAction({
        targetUserId,
        action: "warn",
        reason,
        reportId,
      });
    },
    [insertModerationAction],
  );

  const suspendUser = useCallback(
    async (
      targetUserId: string,
      days: number,
      reason: string,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No supabase client" };

      const suspendedUntil = new Date(
        Date.now() + days * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended: true,
          suspended_until: suspendedUntil,
        })
        .eq("id", targetUserId);

      if (error) return { error: error.message };

      const modResult = await insertModerationAction({
        targetUserId,
        action: "suspend",
        reason,
        details: { days, suspended_until: suspendedUntil },
      });

      return modResult;
    },
    [insertModerationAction],
  );

  const banUser = useCallback(
    async (
      targetUserId: string,
      reason: string,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No supabase client" };

      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "deleted" })
        .eq("id", targetUserId);

      if (error) return { error: error.message };

      return insertModerationAction({
        targetUserId,
        action: "ban",
        reason,
      });
    },
    [insertModerationAction],
  );

  const unbanUser = useCallback(
    async (targetUserId: string): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No supabase client" };

      const { error } = await supabase
        .from("profiles")
        .update({
          account_status: "active",
          is_suspended: false,
          suspended_until: null,
        })
        .eq("id", targetUserId);

      if (error) return { error: error.message };

      return insertModerationAction({
        targetUserId,
        action: "unban",
        reason: "Admin unban",
      });
    },
    [insertModerationAction],
  );

  const changeBadge = useCallback(
    async (
      targetUserId: string,
      badge: string,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No supabase client" };

      const { error } = await supabase
        .from("profiles")
        .update({ badge })
        .eq("id", targetUserId);

      if (error) return { error: error.message };

      await logAudit("change_badge", "user", targetUserId, { badge });
      return {};
    },
    [logAudit],
  );

  // ── Item Actions ──

  const toggleItemActive = useCallback(
    async (
      itemId: string,
      isActive: boolean,
    ): Promise<{ error?: string }> => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "No supabase client" };

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
      if (!supabase) return { error: "No supabase client" };

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
      if (!supabase) return { error: "No supabase client" };

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
    updateReportStatus,
    insertModerationAction,
    warnUser,
    suspendUser,
    banUser,
    unbanUser,
    changeBadge,
    toggleItemActive,
    deleteItem,
    toggleItemDemo,
  };
}
