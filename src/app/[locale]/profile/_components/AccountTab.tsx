"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Download, Pause, Play, Shield, AlertTriangle, Trash2,
} from "lucide-react";
import { Pill, SectionCard } from "@/components/ui-custom";
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from "@/lib/push";
import { isWebAuthnSupported, registerPasskey } from "@/lib/webauthn";
import type { UserProfile, AccountStatus } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase/client";

interface AccountTabProps {
  user: UserProfile;
  draft: UserProfile;
  update: (partial: Partial<UserProfile>) => void;
  changeEmail: (email: string) => Promise<{ error?: string }>;
  changePassword: (password: string) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;
  exportUserData: () => Promise<string>;
  accountStatus: AccountStatus;
  pauseAccount: () => Promise<void>;
  resumeAccount: () => Promise<void>;
}

export default function AccountTab({
  user, draft, update, changeEmail, changePassword,
  deleteAccount, exportUserData, accountStatus, pauseAccount, resumeAccount,
}: AccountTabProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // GDPR state
  const [gdprExportPending, setGdprExportPending] = useState<string | null>(null);
  const [gdprDeletePending, setGdprDeletePending] = useState<string | null>(null);
  const [gdprMessage, setGdprMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [gdprLoading, setGdprLoading] = useState(false);
  const [showGdprDeleteConfirm, setShowGdprDeleteConfirm] = useState(false);
  const [gdprDeleteConfirmText, setGdprDeleteConfirmText] = useState("");

  // Login history (mock)
  const loginHistory = [
    { date: "2025-01-15T10:30:00.000Z", device: "Chrome / macOS", ip: "86.120.***.**" },
    { date: "2025-01-14T10:30:00.000Z", device: "Safari / iOS", ip: "86.120.***.**" },
    { date: "2025-01-13T10:30:00.000Z", device: "Chrome / Windows", ip: "79.115.***.**" },
  ];

  useEffect(() => {
    if (!user?.id) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    sb.from("gdpr_requests")
      .select("type, status, requested_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .then(({ data }) => {
        if (!data) return;
        for (const row of data) {
          if (row.type === "export") setGdprExportPending(row.requested_at);
          if (row.type === "delete") setGdprDeletePending(row.requested_at);
        }
      });
  }, [user?.id]);

  return (
    <>
      <SectionCard title={t("swapPreferences")} description={t("swapPreferencesDescription")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("profileVisibility")}
            <select
              value={draft.visibility.publicProfile ? "public" : "private"}
              onChange={(e) => update({ visibility: { ...draft.visibility, publicProfile: e.target.value === "public" } })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="public">{t("public")}</option>
              <option value="private">{t("private")}</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("itemsVisible")}
            <select
              value={draft.visibility.itemsVisibility}
              onChange={(e) => update({ visibility: { ...draft.visibility, itemsVisibility: e.target.value as UserProfile["visibility"]["itemsVisibility"] } })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="public">{t("public")}</option>
              <option value="match_only">{t("matchOnly")}</option>
            </select>
          </label>
        </div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("preferredLogistics")}
          <select
            value={draft.swapPreferences.logistics}
            onChange={(e) => update({ swapPreferences: { ...draft.swapPreferences, logistics: e.target.value as UserProfile["swapPreferences"]["logistics"] } })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          >
            <option value="in_person">{t("inPerson")}</option>
            <option value="courier">{t("courier")}</option>
            <option value="flexible">{t("flexible")}</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("notes")}
          <textarea
            value={draft.swapPreferences.notes ?? ""}
            onChange={(e) => update({ swapPreferences: { ...draft.swapPreferences, notes: e.target.value } })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={2}
          />
        </label>
        <fieldset>
          <legend className="sr-only">{t("notificationSettings")}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={draft.notifications.email}
                onChange={(e) => update({ notifications: { ...draft.notifications, email: e.target.checked } })} />
              {t("emailNotifications")}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={draft.notifications.push}
                onChange={async (e) => {
                  const enabled = e.target.checked;
                  if (enabled) {
                    const ok = await subscribeToPush(user.id);
                    if (!ok) return; // permission denied or error
                  } else {
                    await unsubscribeFromPush(user.id);
                  }
                  update({ notifications: { ...draft.notifications, push: enabled } });
                }} />
              {t("pushNotifications")}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={draft.notifications.chat}
                onChange={(e) => update({ notifications: { ...draft.notifications, chat: e.target.checked } })} />
              {t("chatNotifications")}
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={draft.notifications.matches}
                onChange={(e) => update({ notifications: { ...draft.notifications, matches: e.target.checked } })} />
              {t("matchNotifications")}
            </label>
          </div>
        </fieldset>

        {/* Smart Notifications */}
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/30 p-3 dark:border-blue-900 dark:bg-blue-950/20">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{t("smartNotifications")}</p>
          <p className="mb-3 text-xs text-blue-600 dark:text-blue-400">{t("smartNotificationsDesc")}</p>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
              <input type="checkbox" checked={draft.notifications.swapUpdates}
                onChange={(e) => update({ notifications: { ...draft.notifications, swapUpdates: e.target.checked } })} />
              {t("swapUpdateAlerts")}
            </label>
            <div>
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("digestFrequency")}</p>
              <select
                value="daily"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="realtime">{t("digestRealtime")}</option>
                <option value="daily">{t("digestDaily")}</option>
                <option value="weekly">{t("digestWeekly")}</option>
                <option value="off">{t("digestOff")}</option>
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{t("matchScoreThreshold")}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t("matchScoreThresholdDesc")}</p>
              <select
                value="70"
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              >
                <option value="50">{t("scoreAbove50")}</option>
                <option value="70">{t("scoreAbove70")}</option>
                <option value="90">{t("scoreAbove90")}</option>
              </select>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title={t("emailChange")} description={t("emailChangeDescription")}>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("currentEmail")}: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{user.email}</span>
        </p>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("newEmail")}
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("newEmailPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
        </label>
        <button type="button" disabled={!newEmail.trim()}
          onClick={async () => {
            setEmailMessage(null);
            const result = await changeEmail(newEmail);
            if (result.error) setEmailMessage({ type: "error", text: result.error });
            else { setEmailMessage({ type: "success", text: t("emailChangeSuccess") }); setNewEmail(""); }
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t("changeEmailButton")}
        </button>
        {emailMessage && (
          <div role="alert" className={`rounded-xl p-3 text-sm font-medium ${emailMessage.type === "error" ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100" : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"}`}>
            {emailMessage.text}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("passwordChange")} description={t("passwordChangeDescription")}>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("newPassword")}
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("newPasswordPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("confirmPassword")}
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
        </label>
        <button type="button" disabled={!newPassword || newPassword !== confirmPassword}
          onClick={async () => {
            setPasswordMessage(null);
            if (newPassword !== confirmPassword) { setPasswordMessage({ type: "error", text: t("passwordMismatch") }); return; }
            const result = await changePassword(newPassword);
            if (result.error) setPasswordMessage({ type: "error", text: result.error });
            else { setPasswordMessage({ type: "success", text: t("passwordChangeSuccess") }); setNewPassword(""); setConfirmPassword(""); }
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t("changePasswordButton")}
        </button>
        {passwordMessage && (
          <div role="alert" className={`rounded-xl p-3 text-sm font-medium ${passwordMessage.type === "error" ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100" : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"}`}>
            {passwordMessage.text}
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("safetyAndControl")} description={t("safetyDescription")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input type="checkbox" checked={draft.security.twoFactorEnabled}
              onChange={(e) => update({ security: { ...draft.security, twoFactorEnabled: e.target.checked } })} />
            {t("twoFactorActive")}
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("twoFactorMethod")}
            <select value={draft.security.method ?? "totp"}
              onChange={(e) => update({ security: { ...draft.security, method: e.target.value as UserProfile["security"]["method"] } })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
              <option value="totp">{t("totp")}</option>
              <option value="sms">{t("smsOtp")}</option>
              <option value="passkey">{t("passkey")}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input type="checkbox" checked={draft.security.passkeysEnabled}
              onChange={async (e) => {
                const enabling = e.target.checked;
                if (enabling) {
                  if (!isWebAuthnSupported()) {
                    alert(t("passkeyNotSupported") ?? "Passkeys are not supported by this browser.");
                    return;
                  }
                  const result = await registerPasskey(user.id, user.email, user.displayName || "");
                  if (!result.success) {
                    alert(result.error || "Passkey registration failed");
                    return;
                  }
                }
                update({ security: { ...draft.security, passkeysEnabled: enabling } });
              }} />
            {t("enablePasskeys")}
          </label>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">{t("logoutAllSessions")}</Pill>
          <Pill color="amber">{t("reportIssues")}</Pill>
        </div>
      </SectionCard>

      <SectionCard title={t("deleteAccount")} description={t("deleteAccountDescription")}>
        {!showDeleteConfirm ? (
          <button type="button" onClick={() => setShowDeleteConfirm(true)}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            {t("deleteAccountButton")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{t("deleteAccountWarning")}</p>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("typeDeleteToConfirm")}
              <input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-800 dark:bg-zinc-800" />
            </label>
            <div className="flex gap-2">
              <button type="button" disabled={deleteConfirmText !== "DELETE"}
                onClick={async () => { await deleteAccount(); router.replace("/login"); }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                {t("confirmDeleteAccount")}
              </button>
              <button type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">
                {t("cancelDelete")}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title={t("loginHistory")} description={t("loginHistoryDesc")}>
        <div className="space-y-2">
          {loginHistory.map((entry, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 text-sm dark:bg-zinc-800/50">
              <div>
                <p className="font-medium text-zinc-800 dark:text-zinc-100">{entry.device}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">IP: {entry.ip}</p>
              </div>
              <span className="text-xs text-zinc-400">
                {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Account Pause */}
      <SectionCard title={t("accountPause")} description={t("accountPauseDesc")}>
        {accountStatus === "active" ? (
          <button type="button" onClick={() => void pauseAccount()}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600">
            <Pause className="h-4 w-4" />{t("pauseAccountButton")}
          </button>
        ) : (
          <div className="space-y-2">
            <Pill color="amber">{t("accountPaused")}</Pill>
            <button type="button" onClick={() => void resumeAccount()}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
              <Play className="h-4 w-4" />{t("resumeAccountButton")}
            </button>
          </div>
        )}
      </SectionCard>

      {/* GDPR */}
      <SectionCard title={t("gdprYourData")} description={t("gdprYourDataDesc")}>
        <div className="space-y-3">
          {gdprExportPending && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <Shield className="mr-1 inline h-4 w-4" />{t("gdprExportPending", { date: new Date(gdprExportPending).toLocaleDateString(locale) })}
            </div>
          )}
          {gdprDeletePending && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
              <AlertTriangle className="mr-1 inline h-4 w-4" />{t("gdprDeletePending", { date: new Date(gdprDeletePending).toLocaleDateString(locale) })}
            </div>
          )}
          {gdprMessage && (
            <div role="alert" className={`rounded-lg p-3 text-sm font-medium ${gdprMessage.type === "error" ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100" : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"}`}>
              {gdprMessage.text}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button"
              onClick={async () => {
                const json = await exportUserData();
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url;
                a.download = `swaply-data-${new Date().toISOString().slice(0, 10)}.json`;
                a.click(); URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              <Download className="h-4 w-4" />{t("downloadMyData")}
            </button>
            <button type="button" disabled={gdprLoading || !!gdprExportPending}
              onClick={async () => {
                if (!user?.id) return;
                setGdprLoading(true); setGdprMessage(null);
                try {
                  const res = await fetch("/api/gdpr/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
                  const data = await res.json();
                  if (!res.ok) setGdprMessage({ type: "error", text: data.error ?? "Eroare" });
                  else { setGdprMessage({ type: "success", text: t("gdprExportSuccess") }); setGdprExportPending(new Date().toISOString()); }
                } catch { setGdprMessage({ type: "error", text: t("networkError") }); }
                finally { setGdprLoading(false); }
              }}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40">
              <Shield className="h-4 w-4" />{t("gdprRequestExport")}
            </button>
            <button type="button" disabled={gdprLoading || !!gdprDeletePending}
              onClick={() => setShowGdprDeleteConfirm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40">
              <Trash2 className="h-4 w-4" />{t("gdprRequestDelete")}
            </button>
          </div>
        </div>
      </SectionCard>

      {/* GDPR Delete Modal */}
      {showGdprDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={t("gdprDeleteConfirmTitle")}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{t("gdprDeleteConfirmTitle")}</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("gdprDeleteConfirmMessage")}</p>
            <input type="text" value={gdprDeleteConfirmText} onChange={(e) => setGdprDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50" />
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button"
                onClick={() => { setShowGdprDeleteConfirm(false); setGdprDeleteConfirmText(""); }}
                className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200">
                {t("gdprDeleteCancel")}
              </button>
              <button type="button" disabled={gdprDeleteConfirmText !== "DELETE" || gdprLoading}
                onClick={async () => {
                  if (!user?.id) return;
                  setGdprLoading(true); setGdprMessage(null);
                  try {
                    const res = await fetch("/api/gdpr/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id }) });
                    const data = await res.json();
                    if (!res.ok) setGdprMessage({ type: "error", text: data.error ?? "Eroare" });
                    else { setGdprMessage({ type: "success", text: t("gdprDeleteSuccess") }); setGdprDeletePending(new Date().toISOString()); }
                  } catch { setGdprMessage({ type: "error", text: t("networkError") }); }
                  finally { setGdprLoading(false); setShowGdprDeleteConfirm(false); setGdprDeleteConfirmText(""); }
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40">
                {t("gdprDeleteConfirmButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
