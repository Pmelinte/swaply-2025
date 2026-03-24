"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseClient } from "@/lib/supabase/client";

type OtpStep = "phone" | "code";

/**
 * Social / OAuth sign-in buttons + Phone OTP flow.
 * Rendered below the email/password form on the login page.
 *
 * NOTE — OAuth providers (Google, Facebook, Apple) and Phone OTP
 * must be enabled in Supabase Dashboard → Authentication → Providers
 * with the correct credentials before they will work.
 *
 *  Google:   Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
 *            Redirect URI: https://<project-ref>.supabase.co/auth/v1/callback
 *  Facebook: Meta Developer Console → App → Facebook Login → Settings
 *            Redirect URI: https://<project-ref>.supabase.co/auth/v1/callback
 *  Apple:    Apple Developer Console → Certificates, Identifiers & Profiles → Services IDs
 *            Redirect URI: https://<project-ref>.supabase.co/auth/v1/callback
 *  Phone:    Supabase Dashboard → Authentication → Providers → Phone (enable Twilio)
 */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.62-2.2.44-3.06-.4C3.79 16.16 4.36 9.53 8.87 9.29c1.28.06 2.15.72 2.91.76.96-.2 1.88-.89 2.91-.81 1.23.1 2.16.58 2.77 1.48-2.54 1.52-1.94 4.87.52 5.81-.62 1.61-1.42 3.2-2.93 4.75zM12.03 9.24c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

export default function SocialAuth() {
  const t = useTranslations("login");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  const handleOAuth = async (provider: "google" | "facebook" | "apple") => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSendOtp = async () => {
    setPhoneError(null);
    const cleaned = phone.replace(/\s+/g, "");
    if (!/^\+\d{7,15}$/.test(cleaned)) {
      setPhoneError(t("invalidPhone"));
      return;
    }
    setPhoneLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { error } = await supabase.auth.signInWithOtp({ phone: cleaned });
      if (error) {
        setPhoneError(error.message);
      } else {
        setOtpStep("code");
        setPhoneError(t("codeSent"));
      }
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setPhoneError(null);
    if (!/^\d{6}$/.test(code)) {
      setPhoneError(t("invalidCode"));
      return;
    }
    setPhoneLoading(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\s+/g, ""),
        token: code,
        type: "sms",
      });
      if (error) {
        setPhoneError(error.message);
      } else {
        setPhoneError(t("phoneLoginSuccess"));
        window.location.href = "/profile";
      }
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : String(err));
    } finally {
      setPhoneLoading(false);
    }
  };

  const oauthButtonClass =
    "flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

  return (
    <div className="mt-5 space-y-4">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">
          {t("orContinueWith")}
        </span>
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
      </div>

      {/* OAuth buttons */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleOAuth("google")}
          className={oauthButtonClass}
        >
          <GoogleIcon />
          {t("continueWithGoogle")}
        </button>

        <button
          type="button"
          onClick={() => void handleOAuth("facebook")}
          className={oauthButtonClass}
        >
          <FacebookIcon />
          {t("continueWithFacebook")}
        </button>

        <button
          type="button"
          onClick={() => void handleOAuth("apple")}
          className={oauthButtonClass}
        >
          <AppleIcon />
          {t("continueWithApple")}
        </button>

        <button
          type="button"
          onClick={() => setShowPhoneForm(!showPhoneForm)}
          className={oauthButtonClass}
        >
          <PhoneIcon />
          {t("continueWithPhone")}
        </button>
      </div>

      {/* Phone OTP form */}
      {showPhoneForm && (
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          {otpStep === "phone" ? (
            <>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {t("enterPhoneNumber")}
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phoneNumberPlaceholder")}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={phoneLoading}
                className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {phoneLoading ? "..." : t("sendCode")}
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                {t("enterVerificationCode")}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-center text-lg tracking-widest dark:border-zinc-700 dark:bg-zinc-800"
                />
              </label>
              <button
                type="button"
                onClick={() => void handleVerifyOtp()}
                disabled={phoneLoading}
                className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {phoneLoading ? "..." : t("verifyCode")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpStep("phone");
                  setCode("");
                  setPhoneError(null);
                }}
                className="w-full text-center text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {t("resendCode")}
              </button>
            </>
          )}

          {phoneError && (
            <p
              className={`text-sm font-medium ${
                phoneError === t("codeSent") || phoneError === t("phoneLoginSuccess")
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {phoneError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
