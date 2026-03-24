"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { DisputeReason, EvidenceType } from "@/lib/types";
import {
  AlertTriangle, Camera, MessageSquare, Package, MapPin, FileText,
  ChevronRight, ChevronLeft, Check, Plus, X,
} from "lucide-react";

interface EvidenceItem {
  evidenceType: EvidenceType;
  content: string;
}

interface DisputeWorkflowProps {
  swapId: string;
  onSubmit: (data: {
    reason: DisputeReason;
    description: string;
    evidence: EvidenceItem[];
  }) => Promise<void>;
  onCancel: () => void;
}

const REASONS: { key: DisputeReason; translationKey: string }[] = [
  { key: "item_not_received", translationKey: "disputeReasonItemNotReceived" },
  { key: "wrong_item", translationKey: "disputeReasonWrongItem" },
  { key: "damaged", translationKey: "disputeReasonDamaged" },
  { key: "condition_mismatch", translationKey: "disputeReasonConditionMismatch" },
  { key: "no_show", translationKey: "disputeReasonNoShow" },
  { key: "other", translationKey: "disputeReasonOther" },
];

const EVIDENCE_TYPES: { key: EvidenceType; translationKey: string; icon: typeof Camera }[] = [
  { key: "photo", translationKey: "disputeEvidencePhoto", icon: Camera },
  { key: "chat_screenshot", translationKey: "disputeEvidenceChatScreenshot", icon: MessageSquare },
  { key: "tracking", translationKey: "disputeEvidenceTracking", icon: Package },
  { key: "meeting_code", translationKey: "disputeEvidenceMeetingCode", icon: MapPin },
  { key: "location_proof", translationKey: "disputeEvidenceLocationProof", icon: MapPin },
  { key: "note", translationKey: "disputeEvidenceNote", icon: FileText },
];

export function DisputeWorkflow({ onSubmit, onCancel }: DisputeWorkflowProps) {
  const t = useTranslations("change");
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState<DisputeReason>("item_not_received");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [newEvidenceType, setNewEvidenceType] = useState<EvidenceType>("photo");
  const [newEvidenceContent, setNewEvidenceContent] = useState("");
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canProceedStep1 = reason && description.trim().length > 10;
  const canSubmit = canProceedStep1;

  const addEvidence = () => {
    if (!newEvidenceContent.trim()) return;
    setEvidence((prev) => [...prev, { evidenceType: newEvidenceType, content: newEvidenceContent.trim() }]);
    setNewEvidenceContent("");
    setShowAddEvidence(false);
  };

  const removeEvidence = (idx: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({ reason, description: description.trim(), evidence });
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: t("disputeStep1Title"), desc: t("disputeStep1Desc") },
    { title: t("disputeStep2Title"), desc: t("disputeStep2Desc") },
    { title: t("disputeStep3Title"), desc: t("disputeStep3Desc") },
  ];

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-800 dark:bg-red-950/20">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
        <h3 className="text-base font-bold text-red-800 dark:text-red-200">{t("disputeWorkflowTitle")}</h3>
        <span className="ml-auto text-xs text-red-500 dark:text-red-400">
          {t("disputeStepOf", { current: step, total: 3 })}
        </span>
      </div>

      {/* Step indicator */}
      <div className="mb-5 flex gap-1">
        {steps.map((s, i) => (
          <div key={s.title} className="flex-1">
            <div className={`h-1.5 rounded-full transition-colors ${
              i + 1 <= step ? "bg-red-500 dark:bg-red-400" : "bg-red-200 dark:bg-red-800"
            }`} />
            <p className={`mt-1 text-[10px] font-medium ${
              i + 1 === step ? "text-red-700 dark:text-red-300" : "text-red-400 dark:text-red-600"
            }`}>{s.title}</p>
          </div>
        ))}
      </div>

      {/* Step 1: Reason + Description */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-300">{t("disputeStep1Title")}</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {REASONS.map(({ key, translationKey }) => (
                <label
                  key={key}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-xs transition ${
                    reason === key
                      ? "border-red-400 bg-red-100 dark:border-red-600 dark:bg-red-900/40"
                      : "border-zinc-200 bg-white hover:border-red-200 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-red-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="dispute_reason"
                    checked={reason === key}
                    onChange={() => setReason(key)}
                    className="h-3 w-3 text-red-600"
                  />
                  <span className="text-zinc-700 dark:text-zinc-200">{t(translationKey)}</span>
                </label>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-red-700 dark:text-red-300">{t("disputeDescriptionLabel")}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("disputeDescriptionPlaceholder")}
              rows={4}
              className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm dark:border-red-800 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
        </div>
      )}

      {/* Step 2: Evidence */}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-red-600 dark:text-red-400">{t("disputeStep2Desc")}</p>

          {/* Existing evidence list */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              {evidence.map((e, idx) => {
                const typeInfo = EVIDENCE_TYPES.find((et) => et.key === e.evidenceType);
                const Icon = typeInfo?.icon ?? FileText;
                return (
                  <div key={idx} className="flex items-start gap-2 rounded-lg border border-red-200 bg-white p-2.5 dark:border-red-800 dark:bg-zinc-800">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase text-red-500">{typeInfo ? t(typeInfo.translationKey) : e.evidenceType}</p>
                      <p className="truncate text-xs text-zinc-700 dark:text-zinc-300">{e.content}</p>
                    </div>
                    <button type="button" onClick={() => removeEvidence(idx)} className="text-red-400 hover:text-red-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
              <p className="text-[10px] text-red-500">{t("disputeEvidenceAdded", { count: evidence.length })}</p>
            </div>
          )}

          {evidence.length === 0 && !showAddEvidence && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("disputeNoEvidence")}</p>
          )}

          {/* Add evidence form */}
          {showAddEvidence ? (
            <div className="rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-800">
              <div className="mb-2 grid grid-cols-3 gap-1 sm:grid-cols-6">
                {EVIDENCE_TYPES.map(({ key, translationKey, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewEvidenceType(key)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] transition ${
                      newEvidenceType === key
                        ? "border-red-400 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300"
                        : "border-zinc-200 text-zinc-600 hover:border-red-200 dark:border-zinc-700 dark:text-zinc-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(translationKey)}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={newEvidenceContent}
                onChange={(e) => setNewEvidenceContent(e.target.value)}
                placeholder={t("disputeEvidenceUrlPlaceholder")}
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm dark:border-red-700 dark:bg-zinc-900 dark:text-zinc-100"
                onKeyDown={(e) => { if (e.key === "Enter") addEvidence(); }}
              />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => setShowAddEvidence(false)} className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-300">
                  {t("disputeCancel")}
                </button>
                <button type="button" onClick={addEvidence} disabled={!newEvidenceContent.trim()} className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40">
                  {t("disputeEvidenceAdd")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddEvidence(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("disputeEvidenceAdd")}
            </button>
          )}
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-xs text-red-600 dark:text-red-400">{t("disputeStep3Desc")}</p>

          <div className="rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-800">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-xs font-bold text-red-700 dark:text-red-300">
                {REASONS.find((r) => r.key === reason) ? t(REASONS.find((r) => r.key === reason)!.translationKey) : reason}
              </span>
            </div>
            <p className="text-xs text-zinc-700 dark:text-zinc-300">{description}</p>
          </div>

          {evidence.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-white p-3 dark:border-red-800 dark:bg-zinc-800">
              <p className="mb-1 text-[10px] font-semibold uppercase text-red-500">{t("disputeEvidenceAdded", { count: evidence.length })}</p>
              {evidence.map((e, idx) => {
                const typeInfo = EVIDENCE_TYPES.find((et) => et.key === e.evidenceType);
                return (
                  <p key={idx} className="text-xs text-zinc-600 dark:text-zinc-400">
                    {typeInfo ? t(typeInfo.translationKey) : e.evidenceType}: {e.content}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-5 flex items-center justify-between">
        <div>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t("disputeBack")}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t("disputeCancel")}
            </button>
          )}
        </div>
        <div>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !canProceedStep1}
              className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              {t("disputeNext")}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="flex items-center gap-1 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
            >
              <Check className="h-3.5 w-3.5" />
              {submitting ? t("disputeSubmitting") : t("disputeSubmit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
