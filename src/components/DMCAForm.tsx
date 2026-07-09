"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { SWAPLY_PUBLIC_BASE_URL, normalizePublicLegalCopy } from "@/lib/legal-copy";

export function DMCAForm() {
  const t = useTranslations("legal");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    infringingUrl: "",
    originalWorkDescription: "",
    originalWorkUrl: "",
    perjuryDeclaration: false,
    ownerDeclaration: false,
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const isValid =
    form.fullName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    form.infringingUrl.trim().length >= 10 &&
    form.originalWorkDescription.trim().length >= 20 &&
    form.perjuryDeclaration &&
    form.ownerDeclaration;

  const handleSubmit = useCallback(async () => {
    if (!isValid) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/dmca/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, [form, isValid]);

  const update = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
          {normalizePublicLegalCopy(t("dmcaFormSent"))}
        </p>
        <p className="text-xs text-zinc-500">{normalizePublicLegalCopy(t("dmcaFormSentDesc"))}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {normalizePublicLegalCopy(t("dmcaFieldName"))}
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => update("fullName", e.target.value)}
          placeholder={normalizePublicLegalCopy(t("dmcaFieldNamePlaceholder"))}
          className={`mt-1 ${inputCls}`}
        />
      </label>

      {/* Email */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {normalizePublicLegalCopy(t("dmcaFieldEmail"))}
        <input
          type="email"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="your@email.com"
          className={`mt-1 ${inputCls}`}
        />
      </label>

      {/* Infringing URL */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {normalizePublicLegalCopy(t("dmcaFieldInfringingUrl"))}
        <input
          type="url"
          value={form.infringingUrl}
          onChange={(e) => update("infringingUrl", e.target.value)}
          placeholder={`${SWAPLY_PUBLIC_BASE_URL}/en/objects/...`}
          className={`mt-1 ${inputCls}`}
        />
      </label>

      {/* Original Work Description */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {normalizePublicLegalCopy(t("dmcaFieldOriginalWork"))}
        <textarea
          value={form.originalWorkDescription}
          onChange={(e) => update("originalWorkDescription", e.target.value)}
          placeholder={normalizePublicLegalCopy(t("dmcaFieldOriginalWorkPlaceholder"))}
          rows={3}
          className={`mt-1 ${inputCls}`}
        />
      </label>

      {/* Original Work URL */}
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
        {normalizePublicLegalCopy(t("dmcaFieldOriginalUrl"))}
        <input
          type="url"
          value={form.originalWorkUrl}
          onChange={(e) => update("originalWorkUrl", e.target.value)}
          placeholder="https://..."
          className={`mt-1 ${inputCls}`}
        />
        <p className="mt-0.5 text-xs text-zinc-400">{normalizePublicLegalCopy(t("dmcaFieldOptional"))}</p>
      </label>

      {/* Perjury Declaration */}
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={form.perjuryDeclaration}
          onChange={(e) => update("perjuryDeclaration", e.target.checked)}
          className="mt-1 rounded"
        />
        <span>{normalizePublicLegalCopy(t("dmcaDeclarationPerjury"))}</span>
      </label>

      {/* Owner Declaration */}
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={form.ownerDeclaration}
          onChange={(e) => update("ownerDeclaration", e.target.checked)}
          className="mt-1 rounded"
        />
        <span>{normalizePublicLegalCopy(t("dmcaDeclarationOwner"))}</span>
      </label>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!isValid || status === "sending"}
          className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {status === "sending"
            ? normalizePublicLegalCopy(t("dmcaFormSending"))
            : normalizePublicLegalCopy(t("dmcaFormSubmit"))}
        </button>
        {status === "error" && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertTriangle className="h-3.5 w-3.5" />
            {normalizePublicLegalCopy(t("dmcaFormError"))}
          </span>
        )}
      </div>
    </div>
  );
}
