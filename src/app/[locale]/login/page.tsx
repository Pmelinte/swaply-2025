"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui-custom";
import { Eye, EyeOff } from "lucide-react";
import SocialAuth from "@/components/SocialAuth";

/** Compute password strength 0–4 */
function getPasswordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];

function LoginContent() {
  const params = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const rawReturnTo = params.get("returnTo") || "/profile";
  // Strip any locale prefix that slipped through (e.g. /en/match → /match)
  const returnTo = rawReturnTo.replace(/^\/[a-z]{2,3}(?=\/)/, "") || "/";
  const initialTab = params.get("tab");
  const [activeTab, setActiveTab] = useState<string>(
    initialTab === "register" || initialTab === "reset" ? initialTab : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accept, setAccept] = useState(false);
  const errorParam = params.get("error");
  const [message, setMessage] = useState<string | null>(
    errorParam === "confirmation" ? t("confirmationFailed") : null,
  );
  const [status, setStatus] = useState<"idle" | "error" | "success">(
    errorParam === "confirmation" ? "error" : "idle",
  );
  const [processing, setProcessing] = useState(false);
  // Guard: ensure at most one navigation happens (prevents useEffect + handleSubmit race)
  const navigatingRef = useRef(false);
  const { login, register, resetPassword, user } = useAppState();

  const tabs = [
    { key: "login", label: t("authentication") },
    { key: "register", label: t("registration") },
    { key: "reset", label: t("resetPassword") },
  ];

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthLabels = [
    t("strengthNone"),
    t("strengthWeak"),
    t("strengthFair"),
    t("strengthGood"),
    t("strengthStrong"),
  ];

  // Hard navigate to ensure fresh cookies are sent to the server
  const hardNavigate = (path: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    window.location.href = `/${locale}${path}`;
  };

  useEffect(() => {
    if (user && !navigatingRef.current) {
      hardNavigate(returnTo);
    }
  }, [user, returnTo]);

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
          hardNavigate(returnTo);
        }
      } else if (activeTab === "register") {
        const result = await register(email, password, accept);
        if (result.error) {
          const errorStr = typeof result.error === "string" ? result.error : String(result.error);
          // Timeout errors are soft — the account may have been created
          const isTimeout = errorStr.toLowerCase().includes("timeout") || errorStr.includes("Account may have been created");
          setMessage(isTimeout ? errorStr : errorStr);
          setStatus(isTimeout ? "success" : "error");
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
              <div className="relative mt-1">
                <input
                  value={password}
                  type={showPassword ? "text" : "password"}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator — show for register tab */}
              {activeTab === "register" && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i < passwordStrength ? strengthColors[passwordStrength] : "bg-zinc-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`mt-1 text-xs ${
                    passwordStrength <= 1 ? "text-red-600 dark:text-red-400" :
                    passwordStrength === 2 ? "text-amber-600 dark:text-amber-400" :
                    "text-green-600 dark:text-green-400"
                  }`}>
                    {strengthLabels[passwordStrength]}
                  </p>
                </div>
              )}
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

        {/* Social auth & Phone OTP */}
        {activeTab !== "reset" && <SocialAuth />}

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
        title={tc("nextStepRecommended")}
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
