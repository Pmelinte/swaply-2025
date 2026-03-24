"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Phone, CheckCircle2, AlertCircle } from "lucide-react";

interface PhoneVerificationFlowProps {
  onRequestCode: (phone: string) => Promise<{ error?: string }>;
  onVerifyCode: (code: string) => Promise<{ error?: string }>;
  onCancel: () => void;
}

export function PhoneVerificationFlow({
  onRequestCode,
  onVerifyCode,
  onCancel,
}: PhoneVerificationFlowProps) {
  const t = useTranslations("profile");
  const [step, setStep] = useState<"phone" | "code" | "done">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async () => {
    setLoading(true);
    setError(null);
    const result = await onRequestCode(phoneNumber.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep("code");
    }
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setError(null);
    const result = await onVerifyCode(code.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStep("done");
    }
  };

  if (step === "done") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t("phoneVerifySuccess")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
      <div className="mb-3 flex items-center gap-2">
        <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200">{t("phoneVerifyTitle")}</h4>
      </div>
      <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">{t("phoneVerifyDesc")}</p>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {step === "phone" && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300">
            {t("phoneNumberLabel")}
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={t("phoneNumberPlaceholder")}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t("cancelDelete")}
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={!phoneNumber.trim() || loading}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {loading ? "..." : t("sendCode")}
            </button>
          </div>
        </div>
      )}

      {step === "code" && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-blue-700 dark:text-blue-300">
            {t("enterCode")}
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={t("codePlaceholder")}
              maxLength={6}
              className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-center text-xl font-mono tracking-widest dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {t("cancelDelete")}
            </button>
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={code.length !== 6 || loading}
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {loading ? "..." : t("verifyCode")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
