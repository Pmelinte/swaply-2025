"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { CTAButton, NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui-custom";
import type { UserProfile } from "@/lib/types";
import ProfileTab from "./_components/ProfileTab";
import PropertiesTab from "./_components/PropertiesTab";
import AccountTab from "./_components/AccountTab";
import ReputationTab from "./_components/ReputationTab";
import AlertsTab from "./_components/AlertsTab";
import NotificationSettingsTab from "./_components/NotificationSettingsTab";
import { ProfileVerification } from "@/features/verification/ProfileVerification";

export function ProfileClient() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const {
    user, updateProfile, changeEmail, changePassword, deleteAccount, loading, lastError,
    achievements, shopItems, purchaseShopItem, exportUserData, accountStatus, pauseAccount, resumeAccount, tokenLedger,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
    verificationBadges, requestPhoneVerification, verifyPhoneCode, submitIdDocument, submitSelfie,
  } = useAppState();

  const [draft, setDraft] = useState<UserProfile | null>(user);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const tss = useTranslations("savedSearches");
  const tn = useTranslations("notificationSettings");
  const [activeTab, setActiveTab] = useState<"profil" | "cont" | "reputatie" | "proprietati" | "alerte" | "notificari" | "verificare">("profil");
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const profileTabs = [
    { key: "profil" as const, label: t("title") },
    { key: "proprietati" as const, label: t("propertiesAndServices") },
    { key: "cont" as const, label: t("accountAndSettings") },
    { key: "reputatie" as const, label: t("reputation") },
    { key: "alerte" as const, label: tss("alertsTab") },
    { key: "notificari" as const, label: tn("tabLabel") },
    { key: "verificare" as const, label: t("verificationTitle") },
  ];

  // Sync draft with user during render
  if (user && !draft) {
    setDraft(user);
  }
  if (!loading.profile && loadingTimeout) {
    setLoadingTimeout(false);
  }

  useEffect(() => {
    if (loading.profile) {
      const timer = setTimeout(() => setLoadingTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [loading.profile]);

  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400 dark:text-zinc-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500 dark:border-zinc-600 dark:border-t-blue-400" />
      </div>
    );
  }

  if (loading.profile && !loadingTimeout) {
    return (
      <SectionCard title={t("loading")} description={t("loadingDescription")}>
        <div className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      </SectionCard>
    );
  }

  if (!user || !draft) {
    return (
      <div className="space-y-6">
        <SectionCard title={t("guestTitle")} description={t("guestDescription")}>
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureRating")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureRatingDesc")}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureBadge")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureBadgeDesc")}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureHistory")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureHistoryDesc")}</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">{t("guestFeatureVerify")}</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("guestFeatureVerifyDesc")}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <div className="text-center">
          <CTAButton href="/register">{t("guestCta")}</CTAButton>
        </div>
      </div>
    );
  }

  const update = (partial: Partial<UserProfile>) => {
    const next = { ...draft, ...partial };
    setDraft(next);
    void updateProfile(next, { persist: false });
  };

  // Profile completeness
  const completenessChecks = [
    !!draft.displayName, !!draft.avatarUrl,
    !!draft.bio && draft.bio.length >= 10,
    !!draft.location?.city, !!draft.location?.country,
    !!draft.email, (draft.languages?.length ?? 0) > 0,
    draft.stats.completedSwaps > 0,
  ];
  const completenessPercent = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 100);

  return (
    <div className="space-y-4">
      {/* Profile completeness bar */}
      <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("profileCompleteness")}</span>
          <span className={`text-sm font-bold ${completenessPercent >= 75 ? "text-green-600" : completenessPercent >= 50 ? "text-amber-600" : "text-red-600"}`}>{completenessPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800" role="progressbar" aria-valuenow={completenessPercent} aria-valuemin={0} aria-valuemax={100}>
          <div
            className={`h-full rounded-full transition-all ${completenessPercent >= 75 ? "bg-green-500" : completenessPercent >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${completenessPercent}%` }}
          />
        </div>
        {completenessPercent < 100 && (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{t("completeProfileHint")}</p>
        )}
      </div>

      {/* Tab navigation */}
      <nav aria-label={t("profileNavigation")}>
        <div className="flex flex-wrap gap-2">
          {profileTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              aria-current={activeTab === tab.key ? "page" : undefined}
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
      </nav>

      {/* Tab content */}
      {activeTab === "profil" && <ProfileTab draft={draft} update={update} userId={user.id} />}
      {activeTab === "proprietati" && (
        <PropertiesTab
          user={user}
          updateHouseProfile={updateHouseProfile}
          addServiceProfile={addServiceProfile}
          removeServiceProfile={removeServiceProfile}
        />
      )}
      {activeTab === "cont" && (
        <AccountTab
          user={user} draft={draft} update={update}
          changeEmail={changeEmail} changePassword={changePassword}
          deleteAccount={deleteAccount} exportUserData={exportUserData}
          accountStatus={accountStatus} pauseAccount={pauseAccount} resumeAccount={resumeAccount}
        />
      )}
      {activeTab === "reputatie" && (
        <ReputationTab
          draft={draft} achievements={achievements}
          shopItems={shopItems} tokenLedger={tokenLedger}
          purchaseShopItem={purchaseShopItem}
        />
      )}
      {activeTab === "alerte" && <AlertsTab userId={user.id} />}
      {activeTab === "notificari" && <NotificationSettingsTab userId={user.id} />}
      {activeTab === "verificare" && (
        <ProfileVerification
          user={user}
          badges={verificationBadges}
          onRequestPhoneVerification={requestPhoneVerification}
          onVerifyPhoneCode={verifyPhoneCode}
          onSubmitIdDocument={submitIdDocument}
          onSubmitSelfie={submitSelfie}
        />
      )}

      {/* Save button (always visible) */}
      <SectionCard title={t("saveProfile")} description={t("saveDescription")}>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={saving}
            onClick={async () => {
              setSaveMessage(null); setSaving(true);
              try { await updateProfile(draft, { persist: true }); setSaveMessage(t("profileSaved")); }
              catch { setSaveMessage(t("saveError")); }
              finally { setSaving(false); }
            }}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t("saving")}
              </span>
            ) : t("saveProfile")}
          </button>
        </div>
        {saveMessage && (
          <div role="alert" className={`rounded-xl p-3 text-sm font-medium ${lastError ? "bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-100" : "bg-green-50 text-green-900 dark:bg-green-900/40 dark:text-green-100"}`}>
            {lastError ? t("errorMessage", { error: lastError }) : saveMessage}
          </div>
        )}
      </SectionCard>

      <NextStepRecommendation
        title={tc("nextStepRecommended")}
        steps={[
          { label: t("addObjects"), href: "/objects/new", description: t("addObjectsDescription") },
          { label: t("findMatches"), href: "/match", description: t("findMatchesDescription") },
          { label: tc("myDesk"), href: "/desk", description: tc("myDeskDescription") },
          { label: t("badgeBenefits"), href: "/info#monetizare", description: t("badgeBenefitsDescription") },
        ]}
      />

      <StateShowcase
        title="PROFILE States"
        states={[
          { key: "loading", title: "Loading profile", description: "Placeholder skeleton for fields + badge visible until user payload arrives." },
          { key: "empty", title: "Incomplete profile", description: "Warning for missing location and save CTA. Missing data does not block the page." },
          { key: "error", title: "Save error", description: "Dedicated message + retry recommendation; form values are not lost." },
        ]}
      />
    </div>
  );
}
