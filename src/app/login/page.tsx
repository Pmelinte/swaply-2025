"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui";

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useTranslations("login");
  const returnTo = params.get("returnTo") || "/profile";
  const [activeTab, setActiveTab] = useState<string>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [processing, setProcessing] = useState(false);
  const { login, register, resetPassword, user } = useAppState();

  const tabs = [
    { key: "login", label: t("authentication") },
    { key: "register", label: t("registration") },
    { key: "reset", label: t("resetPassword") },
  ];

  useEffect(() => {
    if (user) router.replace(returnTo);
  }, [user, returnTo, router]);

  const handleSubmit = async () => {
    setMessage(null);
    setStatus("idle");

    if (!accept) {
      setMessage(t("mustAcceptTerms"));
      setStatus("error");
      return;
    }
    if (!email.trim()) {
      setMessage(t("enterEmail"));
      setStatus("error");
      return;
    }
    if (activeTab !== "reset" && password.length < 6) {
      setMessage(t("passwordMinLength"));
      setStatus("error");
      return;
    }

    setProcessing(true);
    try {
      if (activeTab === "login") {
        const { error } = await login(email, password, accept);
        if (error) {
          setMessage(error);
          setStatus("error");
        } else {
          setMessage(t("authenticated"));
          setStatus("success");
          router.replace(returnTo);
        }
      } else if (activeTab === "register") {
        const { error } = await register(email, password, accept);
        if (error) {
          setMessage(error);
          setStatus("error");
        } else {
          setMessage(t("accountCreated"));
          setStatus("success");
        }
      } else {
        const { error } = await resetPassword(email);
        if (error) {
          setMessage(error);
          setStatus("error");
        } else {
          setMessage(t("resetSent"));
          setStatus("success");
        }
      }
    } catch (err) {
      setMessage(t("unexpectedError", { error: err instanceof Error ? err.message : String(err) }));
      setStatus("error");
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-5">
      <SectionCard
        title={t("authOrRegister")}
        description={t("authDescription")}
      >
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("email")}
            <input
              value={email}
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          {activeTab !== "reset" ? (
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("password")}
              <input
                value={password}
                type="password"
                required
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
            />
            <span>{t("acceptTerms")}</span>
          </label>

          <button
            type="submit"
            disabled={processing}
            className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {activeTab === "login"
              ? t("loginButton")
              : activeTab === "register"
                ? t("createAccount")
                : t("sendReset")
            }
          </button>
        </form>

        {message ? (
          <div
            className={`rounded-xl p-3 text-sm font-medium ${
              status === "error"
                ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100"
                : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
            }`}
          >
            {message}
          </div>
        ) : null}
        {processing ? (
          <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-900/40 dark:text-blue-100">
            {t("verifying")}
          </div>
        ) : null}

        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <p>{t("twoFactorInfo")}</p>
          <p>{t("alternativeMethods")}</p>
          <p>{t("legalInfo")}</p>
        </div>
      </SectionCard>
      <NextStepRecommendation
        steps={[
          { label: t("exploreObjects"), href: "/objects", description: t("exploreObjectsDescription") },
          { label: t("platformInfo"), href: "/info", description: t("platformInfoDescription") },
        ]}
      />
      <StateShowcase
        title={t("statesTitle")}
        states={[
          {
            key: "loading",
            title: t("verifyingSession"),
            description: t("verifyingSessionDescription"),
          },
          {
            key: "empty",
            title: t("emptyForm"),
            description: t("emptyFormDescription"),
          },
          {
            key: "error",
            title: t("invalidCredentials"),
            description: t("invalidCredentialsDescription"),
          },
        ]}
      />
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations("login");
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 text-sm text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
          {t("loadingForm")}
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
