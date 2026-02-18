"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, Plus } from "lucide-react";
import { useAppState } from "@/lib/state";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { Badge, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import type { UserProfile, LanguageCode } from "@/lib/types";
import LocationPicker from "@/components/LocationPicker";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const { user, updateProfile, changeEmail, changePassword, deleteAccount, logout, loading, lastError } = useAppState();
  const router = useRouter();
  const [draft, setDraft] = useState<UserProfile | null>(user);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profil" | "cont" | "reputatie">("profil");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const profileTabs = [
    { key: "profil" as const, label: t("title") },
    { key: "cont" as const, label: t("accountAndSettings") },
    { key: "reputatie" as const, label: t("reputation") },
  ];

  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Sync draft with user during render (React-recommended pattern instead of useEffect)
  if (user && !draft) {
    setDraft(user);
  }

  // Reset loadingTimeout during render when loading finishes
  if (!loading.profile && loadingTimeout) {
    setLoadingTimeout(false);
  }

  useEffect(() => {
    if (loading.profile) {
      const timer = setTimeout(() => setLoadingTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading.profile]);

  if (loading.profile && !loadingTimeout) {
    return (
      <SectionCard
        title={t("loading")}
        description={t("loadingDescription")}
      >
        <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </SectionCard>
    );
  }

  if (!user || !draft) {
    return <LoggedOutGate returnTo="/profile" />;
  }

  const update = (partial: Partial<UserProfile>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    void updateProfile(next, { persist: false });
  };

  const locationIncomplete = !draft.location?.city || !draft.location?.country;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {profileTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profil" ? (
        <>
      <SectionCard
        title={t("publicIdentity")}
        description={t("publicIdentityDescription")}
        action={<Badge tier={draft.badge} />}
      >
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            {draft.avatarUrl ? (
              <Image src={draft.avatarUrl} alt="Avatar" width={80} height={80} className="h-full w-full object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
                {draft.displayName?.charAt(0)?.toUpperCase() ?? "?"}
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {t("avatarUrl")}
              <input
                value={draft.avatarUrl ?? ""}
                onChange={(e) => update({ avatarUrl: e.target.value })}
                placeholder={t("avatarPlaceholder")}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <p className="text-xs text-zinc-400">{t("avatarUploadNote")}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("displayName")}
            <input
              value={draft.displayName}
              onChange={(e) => update({ displayName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("firstName")}
            <input
              value={draft.firstName ?? ""}
              onChange={(e) => update({ firstName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("bio")}
          <textarea
            value={draft.bio ?? ""}
            onChange={(e) => update({ bio: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={3}
          />
        </label>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("spokenLanguages")}</p>
          <div className="flex flex-wrap gap-2">
            {draft.languages.map((lang) => (
              <span key={lang} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                {lang.toUpperCase()}
                <button
                  type="button"
                  onClick={() => update({ languages: draft.languages.filter((l) => l !== lang) })}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <form
              className="inline-flex"
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                const val = input.value.trim().toLowerCase();
                if (val && !draft.languages.includes(val as LanguageCode)) {
                  update({ languages: [...draft.languages, val as LanguageCode] });
                  input.value = "";
                }
              }}
            >
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder={t("languagePlaceholder")}
                  className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </SectionCard>

      {locationIncomplete ? (
        <MissingDataCallout
          title={t("incompleteLocation")}
          message={t("incompleteLocationDescription")}
          cta={<span className="text-sm font-semibold">{t("completeFieldsBelow")}</span>}
        />
      ) : null}

      <SectionCard
        title={t("localization")}
        description={t("localizationDescription")}
      >
        <LocationPicker
          country={draft.location?.country ?? ""}
          region={draft.location?.region ?? ""}
          city={draft.location?.city ?? ""}
          onChange={({ country, region, city }) =>
            update({
              location: {
                ...(draft.location ?? {}),
                country,
                region,
                city,
              },
            })
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("postalCode")}
            <input
              value={draft.location?.postalCode ?? ""}
              onChange={(e) =>
                update({ location: { ...(draft.location ?? {}), postalCode: e.target.value } })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("maxTravelRadius")}
            <input
              type="number"
              value={draft.location?.travelRadiusKm ?? 0}
              onChange={(e) =>
                update({
                  location: {
                    ...(draft.location ?? {}),
                    travelRadiusKm: Number(e.target.value),
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showExactLocation}
              onChange={(e) =>
                update({
                  visibility: { ...draft.visibility, showExactLocation: e.target.checked },
                })
              }
            />
            {t("exactLocationVisible")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.visibility.showLastSeen}
              onChange={(e) =>
                update({
                  visibility: { ...draft.visibility, showLastSeen: e.target.checked },
                })
              }
            />
            {t("lastActivityVisible")}
          </label>
        </div>
      </SectionCard>

        </>
      ) : null}

      {activeTab === "cont" ? (
        <>
      <SectionCard
        title={t("swapPreferences")}
        description={t("swapPreferencesDescription")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("profileVisibility")}
            <select
              value={draft.visibility.publicProfile ? "public" : "private"}
              onChange={(e) =>
                update({ visibility: { ...draft.visibility, publicProfile: e.target.value === "public" } })
              }
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
              onChange={(e) =>
                update({
                  visibility: {
                    ...draft.visibility,
                    itemsVisibility: e.target.value as UserProfile["visibility"]["itemsVisibility"],
                  },
                })
              }
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
            onChange={(e) =>
              update({
                swapPreferences: {
                  ...draft.swapPreferences,
                  logistics: e.target.value as UserProfile["swapPreferences"]["logistics"],
                },
              })
            }
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
            onChange={(e) =>
              update({
                swapPreferences: { ...draft.swapPreferences, notes: e.target.value },
              })
            }
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            rows={2}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.email}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, email: e.target.checked } })
              }
            />
            {t("emailNotifications")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.push}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, push: e.target.checked } })
              }
            />
            {t("pushNotifications")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.chat}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, chat: e.target.checked } })
              }
            />
            {t("chatNotifications")}
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.notifications.matches}
              onChange={(e) =>
                update({ notifications: { ...draft.notifications, matches: e.target.checked } })
              }
            />
            {t("matchNotifications")}
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title={t("emailChange")}
        description={t("emailChangeDescription")}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("currentEmail")}: <span className="font-semibold text-zinc-700 dark:text-zinc-200">{user.email}</span>
        </p>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("newEmail")}
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder={t("newEmailPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <button
          type="button"
          disabled={!newEmail.trim()}
          onClick={async () => {
            setEmailMessage(null);
            const result = await changeEmail(newEmail);
            if (result.error) {
              setEmailMessage({ type: "error", text: result.error });
            } else {
              setEmailMessage({ type: "success", text: t("emailChangeSuccess") });
              setNewEmail("");
            }
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t("changeEmailButton")}
        </button>
        {emailMessage ? (
          <div className={`rounded-xl p-3 text-sm font-medium ${
            emailMessage.type === "error"
              ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100"
              : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
          }`}>
            {emailMessage.text}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title={t("passwordChange")}
        description={t("passwordChangeDescription")}
      >
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("newPassword")}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("newPasswordPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          {t("confirmPassword")}
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          />
        </label>
        <button
          type="button"
          disabled={!newPassword || newPassword !== confirmPassword}
          onClick={async () => {
            setPasswordMessage(null);
            if (newPassword !== confirmPassword) {
              setPasswordMessage({ type: "error", text: t("passwordMismatch") });
              return;
            }
            const result = await changePassword(newPassword);
            if (result.error) {
              setPasswordMessage({ type: "error", text: result.error });
            } else {
              setPasswordMessage({ type: "success", text: t("passwordChangeSuccess") });
              setNewPassword("");
              setConfirmPassword("");
            }
          }}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {t("changePasswordButton")}
        </button>
        {passwordMessage ? (
          <div className={`rounded-xl p-3 text-sm font-medium ${
            passwordMessage.type === "error"
              ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100"
              : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
          }`}>
            {passwordMessage.text}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title={t("safetyAndControl")}
        description={t("safetyDescription")}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.security.twoFactorEnabled}
              onChange={(e) =>
                update({ security: { ...draft.security, twoFactorEnabled: e.target.checked } })
              }
            />
            {t("twoFactorActive")}
          </label>
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {t("twoFactorMethod")}
            <select
              value={draft.security.method ?? "totp"}
              onChange={(e) =>
                update({
                  security: {
                    ...draft.security,
                    method: e.target.value as UserProfile["security"]["method"],
                  },
                })
              }
              className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            >
              <option value="totp">{t("totp")}</option>
              <option value="sms">{t("smsOtp")}</option>
              <option value="passkey">{t("passkey")}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={draft.security.passkeysEnabled}
              onChange={(e) =>
                update({ security: { ...draft.security, passkeysEnabled: e.target.checked } })
              }
            />
            {t("enablePasskeys")}
          </label>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <Pill color="blue">{t("logoutAllSessions")}</Pill>
          <Pill color="amber">{t("reportIssues")}</Pill>
        </div>
      </SectionCard>

      <SectionCard
        title={t("deleteAccount")}
        description={t("deleteAccountDescription")}
      >
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            {t("deleteAccountButton")}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{t("deleteAccountWarning")}</p>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("typeDeleteToConfirm")}
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-800 dark:bg-zinc-800"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={async () => {
                  await deleteAccount();
                  router.replace("/login");
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t("confirmDeleteAccount")}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                className="rounded-full bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200"
              >
                {t("cancelDelete")}
              </button>
            </div>
          </div>
        )}
      </SectionCard>

        </>
      ) : null}

      {activeTab === "reputatie" ? (
        <>
      <SectionCard
        title={t("reputationAndTokens")}
        description={t("reputationDescription")}
        action={<Pill color="green">{draft.stats.reputation}</Pill>}
      >
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("tokens")}</p>
            <p className="text-xl font-bold">{draft.stats.tokens}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("completedSwaps")}</p>
            <p className="text-xl font-bold">{draft.stats.completedSwaps}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("activeListings")}</p>
            <p className="text-xl font-bold">{draft.stats.activeListings}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-zinc-500">{t("badge")}</p>
            <Badge tier={draft.badge} />
          </div>
        </div>
      </SectionCard>

        </>
      ) : null}

      <SectionCard
        title={t("saveProfile")}
        description={t("saveDescription")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              setSaveMessage(null);
              try {
                await updateProfile(draft, { persist: true });
                setSaveMessage(t("profileSaved"));
              } catch {
                setSaveMessage(t("saveError"));
              }
            }}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {t("saveProfile")}
          </button>
        </div>
        {saveMessage ? (
          <div
            className={`rounded-xl p-3 text-sm font-medium ${
              lastError
                ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100"
                : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"
            }`}
          >
            {lastError ? t("errorMessage", { error: lastError }) : saveMessage}
          </div>
        ) : null}
      </SectionCard>

      <NextStepRecommendation
        steps={[
          { label: t("addObjects"), href: "/objects/new", description: t("addObjectsDescription") },
          { label: t("findMatches"), href: "/match", description: t("findMatchesDescription") },
          { label: t("badgeBenefits"), href: "/info#monetizare", description: t("badgeBenefitsDescription") },
        ]}
      />

      <StateShowcase
        title="Stări PROFIL"
        states={[
          {
            key: "loading",
            title: "Se încarcă profilul",
            description: "Placeholder skeleton pentru câmpuri + badge vizibil până sosește payload-ul user.",
          },
          {
            key: "empty",
            title: "Profil incomplet",
            description: "Afișăm avertisment pentru lipsă locație și CTA de salvare. Datele lipsă nu blochează pagina.",
          },
          {
            key: "error",
            title: "Eroare la salvare",
            description: "Mesaj dedicat + recomandare retry; nu pierdem valorile completate în formular.",
          },
        ]}
      />
    </div>
  );
}
