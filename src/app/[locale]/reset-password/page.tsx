"use client";

import { FormEvent, Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SectionCard } from "@/components/ui-custom";
import { getSupabaseClient } from "@/lib/supabase/client";
import { updateRecoveredPassword } from "@/lib/auth/password";

function ResetPasswordContent() {
  const t = useTranslations("resetPassword");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setStatus("idle");
    setProcessing(true);

    const result = await updateRecoveredPassword(getSupabaseClient(), password, confirmPassword);
    if (result.error) {
      setMessage(result.error);
      setStatus("error");
    } else {
      setMessage(t("success"));
      setStatus("success");
      setPassword("");
      setConfirmPassword("");
    }
    setProcessing(false);
  };

  return (
    <SectionCard title={t("title")} description={t("description")}>
      <form className="space-y-3" onSubmit={handleSubmit} noValidate>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("newPassword")}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("newPasswordPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("confirmPassword")}
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <button
          type="submit"
          disabled={processing}
          className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {processing ? t("saving") : t("submit")}
        </button>
      </form>
      {message ? (
        <div
          role="alert"
          className={`mt-3 rounded-xl p-3 text-sm font-medium ${
            status === "error"
              ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100"
              : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
          }`}
        >
          {message}
        </div>
      ) : null}
      {status === "success" ? (
        <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
          {t("backToLogin")}
        </Link>
      ) : null}
    </SectionCard>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  return (
    <>
      <h1 className="sr-only">{t("title")}</h1>
      <Suspense fallback={<div className="rounded-xl p-3 text-sm text-zinc-600">{t("loading")}</div>}>
        <ResetPasswordContent />
      </Suspense>
    </>
  );
}
