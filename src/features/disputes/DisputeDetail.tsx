"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Dispute, DisputeEvidence, DisputeStatus } from "@/lib/types";
import {
  AlertTriangle, Camera, MessageSquare, Package, MapPin, FileText,
  Clock, CheckCircle2, XCircle, Shield, Scale,
} from "lucide-react";

const STATUS_CONFIG: Record<DisputeStatus, { translationKey: string; color: string; icon: typeof Clock }> = {
  open: { translationKey: "disputeStatusOpen", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200", icon: Clock },
  waiting_evidence: { translationKey: "disputeStatusWaitingEvidence", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200", icon: Clock },
  under_review: { translationKey: "disputeStatusUnderReview", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200", icon: Shield },
  resolved_requester: { translationKey: "disputeStatusResolvedRequester", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200", icon: CheckCircle2 },
  resolved_responder: { translationKey: "disputeStatusResolvedResponder", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200", icon: CheckCircle2 },
  resolved_split: { translationKey: "disputeStatusResolvedSplit", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200", icon: Scale },
  rejected: { translationKey: "disputeStatusRejected", color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200", icon: XCircle },
};

const EVIDENCE_ICONS: Record<string, typeof Camera> = {
  photo: Camera,
  chat_screenshot: MessageSquare,
  tracking: Package,
  meeting_code: MapPin,
  location_proof: MapPin,
  note: FileText,
};

const EVIDENCE_LABELS: Record<string, string> = {
  photo: "disputeEvidencePhoto",
  chat_screenshot: "disputeEvidenceChatScreenshot",
  tracking: "disputeEvidenceTracking",
  meeting_code: "disputeEvidenceMeetingCode",
  location_proof: "disputeEvidenceLocationProof",
  note: "disputeEvidenceNote",
};

interface DisputeDetailProps {
  dispute: Dispute;
  evidence: DisputeEvidence[];
  currentUserId: string;
  isAdmin: boolean;
  onResolve?: (resolution: DisputeStatus, notes: string) => Promise<void>;
}

export function DisputeDetail({
  dispute,
  evidence,
  currentUserId,
  isAdmin,
  onResolve,
}: DisputeDetailProps) {
  const t = useTranslations("change");
  const locale = useLocale();
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  const statusCfg = STATUS_CONFIG[dispute.status];
  const StatusIcon = statusCfg.icon;

  const isResolved = dispute.status.startsWith("resolved_") || dispute.status === "rejected";

  const initiatorEvidence = evidence.filter((e) => e.submittedBy === dispute.initiatorId);
  const respondentEvidence = evidence.filter((e) => e.submittedBy === dispute.respondentId);

  const handleResolve = async (resolution: DisputeStatus) => {
    if (!onResolve) return;
    setResolving(true);
    try {
      await onResolve(resolution, resolveNotes);
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/30 p-4 dark:border-red-800 dark:bg-red-950/20">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <h3 className="text-base font-bold text-red-800 dark:text-red-200">{t("disputeDetailTitle")}</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusCfg.color}`}>
          <StatusIcon className="h-3 w-3" />
          {t(statusCfg.translationKey)}
        </span>
      </div>

      {/* Reason & Description */}
      <div className="mb-4 rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-800">
        <p className="mb-1 text-xs font-semibold text-red-700 dark:text-red-300">{t("disputeReason")} {dispute.reason.replace(/_/g, " ")}</p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{dispute.description}</p>
        <p className="mt-2 text-[10px] text-zinc-500">{t("disputeOpenedOn", { date: formatDate(dispute.createdAt) })}</p>
      </div>

      {/* Evidence sections */}
      <div className="mb-4 space-y-3">
        {/* Initiator evidence */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
            {t("disputeEvidenceFromInitiator")}
            {dispute.initiatorId === currentUserId && <span className="ml-1 text-zinc-500">({t("you")})</span>}
          </p>
          {initiatorEvidence.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("disputeNoEvidence")}</p>
          ) : (
            <div className="space-y-1.5">
              {initiatorEvidence.map((e) => {
                const Icon = EVIDENCE_ICONS[e.evidenceType] ?? FileText;
                const labelKey = EVIDENCE_LABELS[e.evidenceType] ?? "disputeEvidenceNote";
                return (
                  <div key={e.id} className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase text-zinc-500">{t(labelKey)}</p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">{e.content}</p>
                      <p className="text-[9px] text-zinc-400">{formatDate(e.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Respondent evidence */}
        <div>
          <p className="mb-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
            {t("disputeEvidenceFromRespondent")}
            {dispute.respondentId === currentUserId && <span className="ml-1 text-zinc-500">({t("you")})</span>}
          </p>
          {respondentEvidence.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{t("disputeNoEvidence")}</p>
          ) : (
            <div className="space-y-1.5">
              {respondentEvidence.map((e) => {
                const Icon = EVIDENCE_ICONS[e.evidenceType] ?? FileText;
                const labelKey = EVIDENCE_LABELS[e.evidenceType] ?? "disputeEvidenceNote";
                return (
                  <div key={e.id} className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase text-zinc-500">{t(labelKey)}</p>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">{e.content}</p>
                      <p className="text-[9px] text-zinc-400">{formatDate(e.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resolution info */}
      {isResolved && dispute.resolutionNotes && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
          <p className="mb-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t("disputeResolutionNotes")}</p>
          <p className="text-sm text-emerald-800 dark:text-emerald-200">{dispute.resolutionNotes}</p>
          {dispute.resolvedAt && (
            <p className="mt-1 text-[10px] text-emerald-600 dark:text-emerald-400">{formatDate(dispute.resolvedAt)}</p>
          )}
        </div>
      )}

      {/* Admin resolution panel */}
      {isAdmin && !isResolved && onResolve && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-amber-800 dark:text-amber-200">
            <Shield className="h-4 w-4" />
            {t("disputeAdminResolve")}
          </h4>
          <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300">
            {t("disputeAdminNotes")}
            <textarea
              value={resolveNotes}
              onChange={(e) => setResolveNotes(e.target.value)}
              placeholder={t("disputeAdminNotesPlaceholder")}
              rows={3}
              className="mt-1 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm dark:border-amber-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={resolving}
              onClick={() => handleResolve("resolved_requester")}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {t("disputeResolveRequester")}
            </button>
            <button
              type="button"
              disabled={resolving}
              onClick={() => handleResolve("resolved_responder")}
              className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {t("disputeResolveResponder")}
            </button>
            <button
              type="button"
              disabled={resolving}
              onClick={() => handleResolve("resolved_split")}
              className="rounded-full bg-zinc-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
            >
              {t("disputeResolveSplit")}
            </button>
            <button
              type="button"
              disabled={resolving}
              onClick={() => handleResolve("rejected")}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              {t("disputeReject")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
