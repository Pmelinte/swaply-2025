"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard } from "@/features/admin/AdminShell";
import { useAdminActions } from "@/features/admin/useAdminActions";
import {
  Flag,
  AlertTriangle,
  Eye,
  CheckCircle,
  Ban,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_item_id: string | null;
  reason: string;
  description: string;
  status: string;
  resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  // Joined data
  reporter_name?: string;
  reported_user_name?: string;
}

type StatusFilter = "all" | "pending" | "reviewed" | "resolved" | "dismissed";
type ReasonFilter = "all" | "spam" | "harassment" | "inappropriate" | "scam" | "prohibited_item" | "other";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  dismissed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

// REASON_LABELS will be derived from translations inside the component

function ReportsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const REASON_LABELS: Record<string, string> = {
    spam: t("reasonSpam"),
    harassment: t("reasonHarassment"),
    inappropriate: t("reasonInappropriate"),
    scam: t("reasonScam"),
    prohibited_item: t("reasonProhibitedItem"),
    other: t("reasonOther"),
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    updateReportStatus,
    warnUser,
    suspendUser,
    toggleItemActive,
    insertModerationAction,
  } = useAdminActions();

  const fetchReports = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);

    let query = supabase
      .from("abuse_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (reasonFilter !== "all") {
      query = query.eq("reason", reasonFilter);
    }

    const { data } = await query;
    setReports((data as Report[]) ?? []);
    setLoading(false);
  }, [statusFilter, reasonFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchReports(), 0);
    return () => clearTimeout(t);
  }, [fetchReports]);

  const handleAction = useCallback(
    async (action: string) => {
      if (!selectedReport) return;
      setActionLoading(true);

      let result: { error?: string } = {};

      switch (action) {
        case "investigate":
          result = await updateReportStatus(selectedReport.id, "reviewed");
          break;
        case "dismiss":
          result = await updateReportStatus(
            selectedReport.id,
            "dismissed",
            "dismissed",
          );
          break;
        case "warn":
          if (selectedReport.reported_user_id) {
            result = await warnUser(
              selectedReport.reported_user_id,
              selectedReport.reason,
              selectedReport.id,
            );
            if (!result.error) {
              result = await updateReportStatus(
                selectedReport.id,
                "resolved",
                "warning_issued",
              );
            }
          }
          break;
        case "hide_item":
          if (selectedReport.reported_item_id) {
            result = await toggleItemActive(
              selectedReport.reported_item_id,
              false,
            );
            if (!result.error && selectedReport.reported_user_id) {
              await insertModerationAction({
                targetUserId: selectedReport.reported_user_id,
                action: "hide_item",
                reason: selectedReport.reason,
                reportId: selectedReport.id,
                details: { item_id: selectedReport.reported_item_id },
              });
            }
            if (!result.error) {
              result = await updateReportStatus(
                selectedReport.id,
                "resolved",
                "confirmed",
              );
            }
          }
          break;
        case "suspend":
          if (selectedReport.reported_user_id) {
            result = await suspendUser(
              selectedReport.reported_user_id,
              7,
              selectedReport.reason,
            );
            if (!result.error) {
              result = await updateReportStatus(
                selectedReport.id,
                "resolved",
                "user_banned",
              );
            }
          }
          break;
      }

      setActionLoading(false);

      if (result.error) {
        alert(`${t("error")}: ${result.error}`);
      } else {
        setSelectedReport(null);
        fetchReports();
      }
    },
    [
      selectedReport,
      updateReportStatus,
      warnUser,
      suspendUser,
      toggleItemActive,
      insertModerationAction,
      fetchReports,
    ],
  );

  // Detail view
  if (selectedReport) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToReports")}
        </button>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("reportId")} #{selectedReport.id.slice(0, 8)}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[selectedReport.status] ?? ""}`}
            >
              {selectedReport.status}
            </span>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">{t("reason")}</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {REASON_LABELS[selectedReport.reason] ?? selectedReport.reason}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">{t("date")}</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {new Date(selectedReport.created_at).toLocaleString("ro-RO")}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">{t("reporterId")}</p>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {selectedReport.reporter_id}
              </p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">
                {t("reportedUser")}
              </p>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                {selectedReport.reported_user_id ?? "N/A"}
              </p>
            </div>
            {selectedReport.reported_item_id && (
              <div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  {t("reportedItem")}
                </p>
                <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {selectedReport.reported_item_id}
                </p>
              </div>
            )}
            {selectedReport.description && (
              <div className="sm:col-span-2">
                <p className="text-zinc-500 dark:text-zinc-400">{t("description")}</p>
                <p className="mt-1 rounded-lg bg-zinc-50 p-3 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {selectedReport.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {selectedReport.status !== "resolved" &&
          selectedReport.status !== "dismissed" && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {t("availableActions")}
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction("investigate")}
                  className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                >
                  <Eye className="h-4 w-4" />
                  {t("markInvestigated")}
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction("dismiss")}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("resolveValid")}
                </button>
                {selectedReport.reported_user_id && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction("warn")}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t("warnUser")}
                  </button>
                )}
                {selectedReport.reported_item_id && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction("hide_item")}
                    className="flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 disabled:opacity-50 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300"
                  >
                    <EyeOff className="h-4 w-4" />
                    {t("hideItem")}
                  </button>
                )}
                {selectedReport.reported_user_id && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleAction("suspend")}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                  >
                    <Ban className="h-4 w-4" />
                    {t("suspendUser7Days")}
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Flag className="mb-0.5 mr-2 inline h-5 w-5" />
          {t("reports")}
        </h2>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("allStatuses")}</option>
          <option value="pending">Pending</option>
          <option value="reviewed">Investigated</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value as ReasonFilter)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("allReasons")}</option>
          <option value="spam">{t("reasonSpam")}</option>
          <option value="harassment">{t("reasonHarassment")}</option>
          <option value="inappropriate">{t("reasonInappropriate")}</option>
          <option value="scam">{t("reasonScam")}</option>
          <option value="prohibited_item">{t("reasonProhibitedItem")}</option>
          <option value="other">{t("reasonOther")}</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
          <p className="mt-2 text-sm text-zinc-500">
            {t("noReports")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  {t("tableId")}
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  {t("tableType")}
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  {t("tableReason")}
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  {t("tableReporter")}
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  {t("tableDate")}
                </th>
                <th className="px-4 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                  {t("tableStatus")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className="cursor-pointer bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
                >
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {report.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {report.reported_item_id ? t("typeItem") : t("typeUser")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {report.reporter_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {new Date(report.created_at).toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[report.status] ?? ""}`}
                    >
                      {report.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminReportsPage() {
  const { user } = useAppState();

  return (
    <AdminGuard user={user}>
      <ReportsContent />
    </AdminGuard>
  );
}
