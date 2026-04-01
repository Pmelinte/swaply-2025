"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { UserProfile, VerificationBadges } from "@/lib/types";
import { SectionCard } from "@/components/ui-custom";
import { PhoneVerificationFlow } from "./PhoneVerificationFlow";
import {
  Mail, Phone, CreditCard, Camera, CheckCircle2, XCircle,
  BarChart3, Activity, AlertTriangle, MapPin,
} from "lucide-react";

interface ProfileVerificationProps {
  user: UserProfile;
  badges: VerificationBadges;
  onRequestPhoneVerification: (phone: string) => Promise<{ error?: string }>;
  onVerifyPhoneCode: (code: string) => Promise<{ error?: string }>;
  onSubmitIdDocument: (url: string, type: string) => Promise<{ error?: string }>;
  onSubmitSelfie: (url: string) => Promise<{ error?: string }>;
}

const LOGISTICS_LABELS: Record<string, string> = {
  in_person: "inPerson",
  courier: "courier",
  flexible: "flexible",
};

export function ProfileVerification({
  user,
  badges,
  onRequestPhoneVerification,
  onVerifyPhoneCode,
  onSubmitIdDocument,
  onSubmitSelfie,
}: ProfileVerificationProps) {
  const t = useTranslations("profile");
  const [showPhoneFlow, setShowPhoneFlow] = useState(false);
  const [showIdUpload, setShowIdUpload] = useState(false);
  const [showSelfieUpload, setShowSelfieUpload] = useState(false);
  const [idUrl, setIdUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [idPending, setIdPending] = useState(false);
  const [selfiePending, setSelfiePending] = useState(false);

  const verificationItems = [
    {
      key: "email",
      icon: Mail,
      verified: badges.email,
      labelVerified: t("emailVerified"),
      labelNotVerified: t("emailNotVerified"),
      action: null, // Email verified through Supabase Auth
    },
    {
      key: "phone",
      icon: Phone,
      verified: badges.phone || user.phoneVerified,
      labelVerified: t("phoneVerified"),
      labelNotVerified: t("phoneNotVerified"),
      action: () => setShowPhoneFlow(true),
    },
    {
      key: "id",
      icon: CreditCard,
      verified: badges.idDocument || user.idVerified,
      labelVerified: t("idVerified"),
      labelNotVerified: t("idNotVerified"),
      action: () => setShowIdUpload(true),
    },
    {
      key: "selfie",
      icon: Camera,
      verified: badges.selfie || user.selfieVerified,
      labelVerified: t("selfieVerified"),
      labelNotVerified: t("selfieNotVerified"),
      action: () => setShowSelfieUpload(true),
    },
  ];

  return (
    <>
      {/* Verification Steps */}
      <SectionCard title={t("verificationTitle")} description={t("verificationDesc")}>
        <div className="space-y-2">
          {verificationItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                  item.verified
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
                    : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50"
                }`}
              >
                <Icon className={`h-5 w-5 ${item.verified ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${item.verified ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {item.verified ? item.labelVerified : item.labelNotVerified}
                  </p>
                </div>
                {item.verified ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : item.action ? (
                  <button
                    type="button"
                    onClick={item.action}
                    className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {t("verifyNow")}
                  </button>
                ) : (
                  <XCircle className="h-5 w-5 text-zinc-300 dark:text-zinc-600" />
                )}
              </div>
            );
          })}
        </div>

        {/* Phone verification flow */}
        {showPhoneFlow && !badges.phone && !user.phoneVerified && (
          <div className="mt-4">
            <PhoneVerificationFlow
              onRequestCode={onRequestPhoneVerification}
              onVerifyCode={async (code) => {
                const result = await onVerifyPhoneCode(code);
                if (!result.error) setShowPhoneFlow(false);
                return result;
              }}
              onCancel={() => setShowPhoneFlow(false)}
            />
          </div>
        )}

        {/* ID document upload */}
        {showIdUpload && !badges.idDocument && !user.idVerified && !idPending && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
            <h4 className="mb-1 text-sm font-bold text-blue-800 dark:text-blue-200">{t("idVerifyTitle")}</h4>
            <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">{t("idVerifyDesc")}</p>
            <input
              type="text"
              value={idUrl}
              onChange={(e) => setIdUrl(e.target.value)}
              placeholder={t("idUploadPlaceholder")}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm dark:border-blue-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setShowIdUpload(false)} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {t("cancelDelete")}
              </button>
              <button
                type="button"
                disabled={!idUrl.trim()}
                onClick={async () => {
                  await onSubmitIdDocument(idUrl.trim(), "government_id");
                  setIdPending(true);
                  setIdUrl("");
                }}
                className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
              >
                {t("submitDocument")}
              </button>
            </div>
          </div>
        )}
        {idPending && (
          <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">{t("documentPending")}</p>
        )}

        {/* Selfie upload */}
        {showSelfieUpload && !badges.selfie && !user.selfieVerified && !selfiePending && (
          <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
            <h4 className="mb-1 text-sm font-bold text-purple-800 dark:text-purple-200">{t("selfieVerifyTitle")}</h4>
            <p className="mb-3 text-xs text-purple-600 dark:text-purple-400">{t("selfieVerifyDesc")}</p>
            <input
              type="text"
              value={selfieUrl}
              onChange={(e) => setSelfieUrl(e.target.value)}
              placeholder={t("selfieUploadPlaceholder")}
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm dark:border-purple-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => setShowSelfieUpload(false)} className="rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {t("cancelDelete")}
              </button>
              <button
                type="button"
                disabled={!selfieUrl.trim()}
                onClick={async () => {
                  await onSubmitSelfie(selfieUrl.trim());
                  setSelfiePending(true);
                  setSelfieUrl("");
                }}
                className="rounded-full bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-40"
              >
                {t("submitDocument")}
              </button>
            </div>
          </div>
        )}
        {selfiePending && (
          <p className="mt-3 text-xs text-purple-600 dark:text-purple-400">{t("documentPending")}</p>
        )}
      </SectionCard>

      {/* Public Stats */}
      <SectionCard title={t("statsTitle")} description={t("statsDesc")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <p className="text-xs uppercase text-zinc-500">{t("responseRate")}</p>
            </div>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{user.responseRate ?? 0}%</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <p className="text-xs uppercase text-zinc-500">{t("completedSwaps")}</p>
            </div>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{user.stats.completedSwaps}</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs uppercase text-zinc-500">{t("disputeRate")}</p>
            </div>
            <p className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50">{user.disputeRate ?? 0}%</p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-500" />
              <p className="text-xs uppercase text-zinc-500">{t("preferredLogisticsLabel")}</p>
            </div>
            <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {t(LOGISTICS_LABELS[user.swapPreferences.logistics] ?? "flexible")}
            </p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}
