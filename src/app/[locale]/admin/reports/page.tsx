"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { AdminGuard } from "@/features/admin/AdminShell";
import { useAdminActions } from "@/features/admin/useAdminActions";
import type {
  SafetyReportAction,
  SafetyReportReason,
  SafetyReportStatus,
} from "@/lib/safety/reportBlockPolicy";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle,
  Eye,
  EyeOff,
  Flag,
} from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  entity_type: "profile" | "item";
  entity_id: string;
  reported_user_id: string;
  reported_item_id: string | null;
  reason: SafetyReportReason;
  description: string | null;
  evidence: Array<{ evidence_type?: string; content?: string }> | null;
  status: SafetyReportStatus;
  resolution: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

type StatusFilter = "all" | SafetyReportStatus;
type ReasonFilter = "all" | SafetyReportReason;

const STATUS_COLORS: Record<SafetyReportStatus, string> = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  investigating: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  dismissed: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function ReportsContent() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { resolveReport } = useAdminActions();

  const reasonLabels: Record<SafetyReportReason, string> = {
    spam: t("reasonSpam"),
    harassment: t("reasonHarassment"),
    inappropriate: t("reasonInappropriate"),
    scam: t("reasonScam"),
    prohibited_item: t("reasonProhibitedItem"),
    other: t("reasonOther"),
  };

  const fetchReports = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setReports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let query = supabase
      .from("reports")
      .select(
        "id, reporter_id, entity_type, entity_id, reported_user_id, reported_item_id, reason, description, evidence, status, resolution, resolution_notes, created_at, resolved_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (reasonFilter !== "all") query = query.eq("reason", reasonFilter);

    const { data, error } = await query;
    setReports(error ? [] : ((data ?? []) as Report[]));
    setLoading(false);
  }, [reasonFilter, statusFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchReports(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchReports]);

  const openReport = (report: Report) => {
    setSelectedReport(report);
    setResolutionNotes(report.resolution_notes ?? "");
    setActionError(null);
  };

  const handleAction = async (action: SafetyReportAction) => {
    if (!selectedReport || actionLoading) return;
    if (!(["open", "investigating"] as const).includes(selectedReport.status as "open" | "investigating")) {
      setActionError("This report is already closed.");
      return;
    }

    if (action !== "investigate" && resolutionNotes.trim().length < 3) {
      setActionError("Resolution notes are required.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    const result = await resolveReport({
      reportId: selectedReport.id,
      expectedStatus: selectedReport.status as "open" | "investigating",
      action,
      notes: resolutionNotes,
    });
    setActionLoading(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    setSelectedReport(null);
    setResolutionNotes("");
    await fetchReports();
  };

  if (selectedReport) {
    const isClosed = selectedReport.status === "resolved" || selectedReport.status === "dismissed";

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

        <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {t("reportId")} #{selectedReport.id.slice(0, 8)}
            </h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[selectedReport.status]}`}>
              {selectedReport.status}
            </span>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label={t("reason")} value={reasonLabels[selectedReport.reason]} />
            <Detail
              label={t("date")}
              value={new Date(selectedReport.created_at).toLocaleString(locale)}
            />
            <Detail label={t("reporterId")} value={selectedReport.reporter_id} mono />
            <Detail label={t("reportedUser")} value={selectedReport.reported_user_id} mono />
            {selectedReport.reported_item_id && (
              <Detail label={t("reportedItem")} value={selectedReport.reported_item_id} mono />
            )}
            {selectedReport.description && (
              <div className="sm:col-span-2">
                <p className="text-zinc-500 dark:text-zinc-400">{t("description")}</p>
                <p className="mt-1 whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {selectedReport.description}
                </p>
              </div>
            )}
            {Array.isArray(selectedReport.evidence) && selectedReport.evidence.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-zinc-500 dark:text-zinc-400">Evidence</p>
                <ul className="mt-1 space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                  {selectedReport.evidence.map((entry, index) => (
                    <li key={`${entry.evidence_type ?? "evidence"}-${index}`} className="break-words text-zinc-700 dark:text-zinc-300">
                      <strong>{entry.evidence_type ?? "evidence"}:</strong> {entry.content ?? ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {!isClosed && (
          <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Resolution notes
              <textarea
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                maxLength={2000}
                rows={4}
                disabled={actionLoading}
                placeholder="Record the evidence and reasoning behind the moderation decision."
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm font-normal disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>

            {actionError && (
              <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
                {actionError}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedReport.status === "open" && (
                <ActionButton
                  disabled={actionLoading}
                  onClick={() => void handleAction("investigate")}
                  icon={<Eye className="h-4 w-4" />}
                  label={t("markInvestigated")}
                  className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                />
              )}
              <ActionButton
                disabled={actionLoading}
                onClick={() => void handleAction("dismiss")}
                icon={<CheckCircle className="h-4 w-4" />}
                label={t("resolveValid")}
                className="border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              />
              <ActionButton
                disabled={actionLoading}
                onClick={() => void handleAction("warn")}
                icon={<AlertTriangle className="h-4 w-4" />}
                label={t("warnUser")}
                className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
              />
              {selectedReport.reported_item_id && (
                <ActionButton
                  disabled={actionLoading}
                  onClick={() => void handleAction("hide_item")}
                  icon={<EyeOff className="h-4 w-4" />}
                  label={t("hideItem")}
                  className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300"
                />
              )}
              <ActionButton
                disabled={actionLoading}
                onClick={() => void handleAction("suspend_7d")}
                icon={<Ban className="h-4 w-4" />}
                label={t("suspendUser7Days")}
                className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
              />
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          <Flag className="mb-0.5 mr-2 inline h-5 w-5" />
          {t("reports")}
        </h2>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("allStatuses")}</option>
          <option value="open">open</option>
          <option value="investigating">investigating</option>
          <option value="resolved">resolved</option>
          <option value="dismissed">dismissed</option>
        </select>
        <select
          value={reasonFilter}
          onChange={(event) => setReasonFilter(event.target.value as ReasonFilter)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="all">{t("allReasons")}</option>
          {Object.entries(reasonLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="h-32 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
          {t("noReports")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => openReport(report)}
              className="grid w-full gap-2 border-b border-zinc-100 p-4 text-left transition hover:bg-zinc-50 last:border-0 dark:border-zinc-800 dark:hover:bg-zinc-800/60 sm:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {reasonLabels[report.reason]}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {report.description || `${report.entity_type}: ${report.entity_id}`}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                  {report.status}
                </span>
                <span className="text-xs text-zinc-400">
                  {new Date(report.created_at).toLocaleDateString(locale)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`${mono ? "font-mono text-xs" : "font-medium"} break-all text-zinc-900 dark:text-zinc-50`}>
        {value}
      </p>
    </div>
  );
}

function ActionButton({
  disabled,
  onClick,
  icon,
  label,
  className,
}: {
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon}
      {label}
    </button>
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
