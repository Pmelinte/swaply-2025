/**
 * Audit Log — server-side function for logging actions to Supabase.
 *
 * Calls the Supabase RPC `log_action()` using the service role key.
 * Automatically extracts IP and user-agent from Next.js Request when provided.
 *
 * Usage:
 *   await logAction({ userId: "...", action: "swap.status_changed", entityType: "swap", entityId: "...", newData: { status: "completed" } });
 *   await logAction({ userId: "...", action: "payment.completed", entityType: "payment", request });
 */

import { getServiceSupabase } from "@/lib/supabase/service";

export interface LogActionParams {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  request?: Request;
}

/**
 * Log an action to the audit_log table via Supabase RPC log_action().
 * Uses service role key (bypasses RLS). Fire-and-forget safe — errors are logged but never thrown.
 */
export async function logAction(params: LogActionParams): Promise<void> {
  try {
    const sb = getServiceSupabase();
    if (!sb) return;

    let ip: string | null = null;
    let userAgent: string | null = null;

    if (params.request) {
      ip =
        params.request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        params.request.headers.get("x-real-ip") ??
        null;
      userAgent = params.request.headers.get("user-agent") ?? null;
    }

    const { error } = await sb.rpc("log_action", {
      p_user_id: params.userId,
      p_action: params.action,
      p_entity_type: params.entityType,
      p_entity_id: params.entityId ?? null,
      p_old_data: params.oldData ? JSON.stringify(params.oldData) : null,
      p_new_data: params.newData ? JSON.stringify(params.newData) : null,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("[audit] log_action RPC failed:", error.message);
    }
  } catch (err) {
    console.error("[audit] logAction error:", err);
  }
}
