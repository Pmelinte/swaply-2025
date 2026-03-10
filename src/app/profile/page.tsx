"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { LoggedOutGate } from "@/components/gated";
import { NextStepRecommendation, SectionCard, StateShowcase } from "@/components/ui";
import type { UserProfile } from "@/lib/types";
import ProfileTab from "./_components/ProfileTab";
import PropertiesTab from "./_components/PropertiesTab";
import AccountTab from "./_components/AccountTab";
import ReputationTab from "./_components/ReputationTab";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const {
    user, updateProfile, changeEmail, changePassword, deleteAccount, loading, lastError,
    achievements, shopItems, purchaseShopItem, exportUserData, accountStatus, pauseAccount, resumeAccount, tokenLedger,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
  } = useAppState();

  const [draft, setDraft] = useState<UserProfile | null>(user);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profil" | "cont" | "reputatie" | "proprietati">("profil");
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  const profileTabs = [
    { key: "profil" as const, label: t("title") },
    { key: "proprietati" as const, label: t("propertiesAndServices") },
    { key: "cont" as const, label: t("accountAndSettings") },
    { key: "reputatie" as const, label: t("reputation") },
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
        <SectionCard title="Profilul tău Swaply" description="Construiește-ți reputația și gestionează-ți contul">
          <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              Profilul tău este cartea ta de vizită în comunitatea Swaply. Cu cât este mai complet, cu atât mai multă încredere inspiră celorlalți utilizatori.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Verificare identitate</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Verifică-ți email-ul, telefonul și identitatea pentru badge-ul de utilizator verificat.</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Sistem de reputație</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Primește recenzii după fiecare schimb și urcă în clasamentul comunității.</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Realizări și badge-uri</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Deblochează realizări pe măsură ce faci schimburi și contribui la comunitate.</p>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Control GDPR complet</h4>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Exportă sau șterge datele tale oricând, conform reglementărilor europene.</p>
              </div>
            </div>
          </div>
        </SectionCard>
        <LoggedOutGate returnTo="/profile" />
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
        steps={[
          { label: t("addObjects"), href: "/objects/new", description: t("addObjectsDescription") },
          { label: t("findMatches"), href: "/match", description: t("findMatchesDescription") },
          { label: t("badgeBenefits"), href: "/info#monetizare", description: t("badgeBenefitsDescription") },
        ]}
      />

      <StateShowcase
        title="Stări PROFIL"
        states={[
          { key: "loading", title: "Se încarcă profilul", description: "Placeholder skeleton pentru câmpuri + badge vizibil până sosește payload-ul user." },
          { key: "empty", title: "Profil incomplet", description: "Afișăm avertisment pentru lipsă locație și CTA de salvare. Datele lipsă nu blochează pagina." },
          { key: "error", title: "Eroare la salvare", description: "Mesaj dedicat + recomandare retry; nu pierdem valorile completate în formular." },
        ]}
      />
    </div>
  );
}
