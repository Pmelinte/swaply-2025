"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  X, Plus, Download, Pause, Play, ShoppingCart, Trophy, Lock,
  Home, Wifi, Car, Snowflake, Flame, WashingMachine, CookingPot, Waves,
  Trees, Dog, Tv, Monitor, Trash2, Package,
  Palette, Code, GraduationCap, Hammer, Briefcase,
} from "lucide-react";
import { useAppState } from "@/lib/state";
import { LoggedOutGate, MissingDataCallout } from "@/components/gated";
import { Badge, NextStepRecommendation, Pill, SectionCard, StateShowcase } from "@/components/ui";
import type { UserProfile, LanguageCode, HouseProfile, ServiceProfile, HouseAmenity, HouseRule, PropertyType, HouseSwapMode, ServiceCategory, SkillLevel, ServiceDelivery } from "@/lib/types";
import { languageNames, localeFlagUrl, type Locale, locales } from "@/i18n/config";
import LocationPicker from "@/components/LocationPicker";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const {
    user, updateProfile, changeEmail, changePassword, deleteAccount, logout, loading, lastError,
    achievements, shopItems, purchaseShopItem, exportUserData, accountStatus, pauseAccount, resumeAccount, tokenLedger,
    updateHouseProfile, addServiceProfile, removeServiceProfile,
  } = useAppState();
  const router = useRouter();
  const [draft, setDraft] = useState<UserProfile | null>(user);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profil" | "cont" | "reputatie" | "proprietati">("profil");
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
    { key: "proprietati" as const, label: t("propertiesAndServices") },
    { key: "cont" as const, label: t("accountAndSettings") },
    { key: "reputatie" as const, label: t("reputation") },
  ];

  // House profile draft
  const defaultHouseProfile: HouseProfile = {
    propertyType: "apartment", bedrooms: 1, bathrooms: 1, maxGuests: 2,
    amenities: [], rules: [], description: "", neighborhood: "",
    nearbyAttractions: "", transport: "", photos: [],
    availableDates: [], minStayDays: 1, maxStayDays: 30,
    swapMode: "simultaneous", verified: false, insuranceReminder: false,
  };
  const [houseDraft, setHouseDraft] = useState<HouseProfile>(user?.houseProfile ?? defaultHouseProfile);
  const [houseSaveMsg, setHouseSaveMsg] = useState<string | null>(null);

  // Service profile draft
  const defaultServiceProfile: ServiceProfile = {
    category: "creative", skillName: "", skillLevel: "intermediate",
    description: "", portfolio: [], hoursPerWeek: 5,
    delivery: "remote", hourlyEquivalent: 0,
  };
  const [serviceDraft, setServiceDraft] = useState<ServiceProfile>(defaultServiceProfile);
  const [serviceSaveMsg, setServiceSaveMsg] = useState<string | null>(null);

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

  // Profile completeness calculation
  const completenessChecks = [
    !!draft.displayName,
    !!draft.avatarUrl,
    !!draft.bio && draft.bio.length >= 10,
    !!draft.location?.city,
    !!draft.location?.country,
    !!draft.email,
    (draft.languages?.length ?? 0) > 0,
    draft.stats.completedSwaps > 0,
  ];
  const completenessPercent = Math.round((completenessChecks.filter(Boolean).length / completenessChecks.length) * 100);

  // Mock login history
  const loginHistory = [
    { date: new Date().toISOString(), device: "Chrome / macOS", ip: "86.120.***.**" },
    { date: new Date(Date.now() - 86400000).toISOString(), device: "Safari / iOS", ip: "86.120.***.**" },
    { date: new Date(Date.now() - 172800000).toISOString(), device: "Chrome / Windows", ip: "79.115.***.**" },
  ];

  return (
    <div className="space-y-4">
      {/* Profile completeness */}
      <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("profileCompleteness")}</span>
          <span className={`text-sm font-bold ${completenessPercent >= 75 ? "text-green-600" : completenessPercent >= 50 ? "text-amber-600" : "text-red-600"}`}>{completenessPercent}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all ${completenessPercent >= 75 ? "bg-green-500" : completenessPercent >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${completenessPercent}%` }}
          />
        </div>
        {completenessPercent < 100 && (
          <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{t("completeProfileHint")}</p>
        )}
      </div>

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
            {draft.languages.map((lang) => {
              const info = languageNames[lang as Locale];
              return (
                <span key={lang} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {info && <img src={localeFlagUrl(lang as Locale)} alt="" width={16} height={12} className="rounded-sm" />}
                  {info ? info.nativeName : lang.toUpperCase()}
                  <button
                    type="button"
                    onClick={() => update({ languages: draft.languages.filter((l) => l !== lang) })}
                    className="text-blue-600 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            <div className="inline-flex items-center gap-1">
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value as LanguageCode;
                  if (val && !draft.languages.includes(val)) {
                    update({ languages: [...draft.languages, val] });
                  }
                }}
                className="w-40 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">{t("addLanguage")}</option>
                {locales
                  .filter((loc) => !draft.languages.includes(loc as LanguageCode))
                  .map((loc) => {
                    const info = languageNames[loc];
                    return (
                      <option key={loc} value={loc}>
                        {info.nativeName} ({info.name})
                      </option>
                    );
                  })}
              </select>
            </div>
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

      {activeTab === "proprietati" ? (
        <>
          {/* ── House Profile ── */}
          <SectionCard
            title={t("myProperty")}
            description={t("myPropertyDesc")}
            action={<Pill color="blue"><Home className="inline h-3 w-3 mr-1" />{t("houseSwap")}</Pill>}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("houseSwapMode")}
                <select
                  value={houseDraft.swapMode}
                  onChange={(e) => setHouseDraft({ ...houseDraft, swapMode: e.target.value as HouseSwapMode })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {(["simultaneous", "non_simultaneous", "one_way_hosting", "permanent"] as const).map((m) => (
                    <option key={m} value={m}>{t(`houseMode_${m}`)}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("housePropertyType")}
                <select
                  value={houseDraft.propertyType}
                  onChange={(e) => setHouseDraft({ ...houseDraft, propertyType: e.target.value as PropertyType })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  {(["apartment", "house", "villa", "cabin", "studio", "room"] as const).map((pt) => (
                    <option key={pt} value={pt}>{t(`propType_${pt}`)}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("houseBedrooms")}
                <input type="number" min={0} max={20} value={houseDraft.bedrooms}
                  onChange={(e) => setHouseDraft({ ...houseDraft, bedrooms: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("houseBathrooms")}
                <input type="number" min={0} max={10} value={houseDraft.bathrooms}
                  onChange={(e) => setHouseDraft({ ...houseDraft, bathrooms: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("houseMaxGuests")}
                <input type="number" min={1} max={30} value={houseDraft.maxGuests}
                  onChange={(e) => setHouseDraft({ ...houseDraft, maxGuests: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
            </div>
            {/* Amenities */}
            <div>
              <p className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("houseAmenities")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["wifi", "parking", "ac", "heating", "washer", "kitchen", "pool", "garden", "pet_friendly", "tv", "workspace"] as HouseAmenity[]).map((a) => {
                  const active = houseDraft.amenities.includes(a);
                  return (
                    <button key={a} type="button"
                      onClick={() => setHouseDraft({
                        ...houseDraft,
                        amenities: active ? houseDraft.amenities.filter((x) => x !== a) : [...houseDraft.amenities, a],
                      })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}
                    >
                      {t(`amenity_${a}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* House Rules */}
            <div>
              <p className="mb-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">{t("houseRulesTitle")}</p>
              <div className="flex flex-wrap gap-1.5">
                {(["no_smoking", "no_pets", "no_parties", "no_shoes", "quiet_hours", "max_guests"] as HouseRule[]).map((r) => {
                  const active = houseDraft.rules.includes(r);
                  return (
                    <button key={r} type="button"
                      onClick={() => setHouseDraft({
                        ...houseDraft,
                        rules: active ? houseDraft.rules.filter((x) => x !== r) : [...houseDraft.rules, r],
                      })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${active ? "bg-amber-500 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"}`}
                    >
                      {t(`rule_${r}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Dates */}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("houseDateFrom")}
                <input type="date"
                  value={houseDraft.availableDates[0]?.from ?? ""}
                  onChange={(e) => setHouseDraft({
                    ...houseDraft,
                    availableDates: [{ from: e.target.value, to: houseDraft.availableDates[0]?.to ?? "" }],
                  })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("houseDateTo")}
                <input type="date"
                  value={houseDraft.availableDates[0]?.to ?? ""}
                  onChange={(e) => setHouseDraft({
                    ...houseDraft,
                    availableDates: [{ from: houseDraft.availableDates[0]?.from ?? "", to: e.target.value }],
                  })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
              </label>
            </div>
            {/* Description */}
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("houseDesc")}
              <textarea value={houseDraft.description}
                onChange={(e) => setHouseDraft({ ...houseDraft, description: e.target.value })}
                placeholder={t("houseDescPlaceholder")}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                rows={3} />
            </label>
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              {t("houseNeighborhood")}
              <textarea value={houseDraft.neighborhood}
                onChange={(e) => setHouseDraft({ ...houseDraft, neighborhood: e.target.value })}
                placeholder={t("houseNeighborhoodPlaceholder")}
                className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                rows={2} />
            </label>
            {/* Save */}
            <div className="flex items-center gap-2">
              <button type="button"
                onClick={async () => {
                  await updateHouseProfile(houseDraft);
                  setHouseSaveMsg(t("propertySaved"));
                  setTimeout(() => setHouseSaveMsg(null), 3000);
                }}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {t("saveProperty")}
              </button>
              {houseSaveMsg && <span className="text-sm text-green-600 dark:text-green-400">{houseSaveMsg}</span>}
            </div>
          </SectionCard>

          {/* ── My Services ── */}
          <SectionCard
            title={t("myServices")}
            description={t("myServicesDesc")}
            action={<Pill color="green"><Briefcase className="inline h-3 w-3 mr-1" />{t("serviceSwap")}</Pill>}
          >
            {/* Existing services */}
            {(user.serviceProfiles ?? []).length > 0 && (
              <div className="space-y-2">
                {user.serviceProfiles!.map((sp) => {
                  const catIcons: Record<string, React.ReactNode> = {
                    creative: <Palette className="h-4 w-4" />,
                    technical: <Code className="h-4 w-4" />,
                    education: <GraduationCap className="h-4 w-4" />,
                    physical: <Hammer className="h-4 w-4" />,
                    professional: <Briefcase className="h-4 w-4" />,
                  };
                  return (
                    <div key={sp.skillName} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <span className="text-blue-600 dark:text-blue-400">{catIcons[sp.category]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{sp.skillName}</p>
                        <p className="text-[10px] text-zinc-500">{t(`svcCat_${sp.category}`)} &middot; {t(`svcLevel${sp.skillLevel.charAt(0).toUpperCase() + sp.skillLevel.slice(1)}`)} &middot; {t(`svcDelivery${sp.delivery.charAt(0).toUpperCase() + sp.delivery.slice(1).replace(/_./g, (m) => m[1].toUpperCase())}`)} &middot; {sp.hoursPerWeek}h/{t("week")}</p>
                      </div>
                      <button type="button"
                        onClick={() => void removeServiceProfile(sp.skillName)}
                        className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Add new service */}
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-800/50">
              <p className="mb-2 text-xs font-semibold text-zinc-500 uppercase">{t("addNewService")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("serviceCategory")}
                  <select value={serviceDraft.category}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, category: e.target.value as ServiceCategory })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                    {(["creative", "technical", "education", "physical", "professional"] as const).map((c) => (
                      <option key={c} value={c}>{t(`svcCat_${c}`)}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("serviceSkillName")}
                  <input value={serviceDraft.skillName}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, skillName: e.target.value })}
                    placeholder={t("serviceSkillPlaceholder")}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
                </label>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("serviceLevel")}
                  <select value={serviceDraft.skillLevel}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, skillLevel: e.target.value as SkillLevel })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <option value="beginner">{t("svcLevelBeginner")}</option>
                    <option value="intermediate">{t("svcLevelIntermediate")}</option>
                    <option value="expert">{t("svcLevelExpert")}</option>
                  </select>
                </label>
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                  {t("serviceDeliveryMethod")}
                  <select value={serviceDraft.delivery}
                    onChange={(e) => setServiceDraft({ ...serviceDraft, delivery: e.target.value as ServiceDelivery })}
                    className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800">
                    <option value="remote">{t("svcDeliveryRemote")}</option>
                    <option value="in_person">{t("svcDeliveryInPerson")}</option>
                    <option value="hybrid">{t("svcDeliveryHybrid")}</option>
                  </select>
                </label>
              </div>
              <label className="mt-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("serviceHoursPerWeek")}: {serviceDraft.hoursPerWeek}h
                <input type="range" min={1} max={40} value={serviceDraft.hoursPerWeek}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, hoursPerWeek: Number(e.target.value) })}
                  className="mt-1 w-full" />
              </label>
              <label className="mt-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {t("serviceDescription")}
                <textarea value={serviceDraft.description}
                  onChange={(e) => setServiceDraft({ ...serviceDraft, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                  rows={2} />
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button type="button"
                  disabled={!serviceDraft.skillName.trim()}
                  onClick={async () => {
                    await addServiceProfile(serviceDraft);
                    setServiceSaveMsg(t("serviceSaved"));
                    setServiceDraft(defaultServiceProfile);
                    setTimeout(() => setServiceSaveMsg(null), 3000);
                  }}
                  className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <Plus className="inline h-3 w-3 mr-1" />{t("addService")}
                </button>
                {serviceSaveMsg && <span className="text-sm text-green-600 dark:text-green-400">{serviceSaveMsg}</span>}
              </div>
            </div>
          </SectionCard>

          {/* Cross-swap info */}
          <SectionCard title={t("crossSwap")} description={t("crossSwapDesc")}>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-center dark:border-blue-800 dark:bg-blue-950/20">
                <Package className="mx-auto h-6 w-6 text-blue-600 dark:text-blue-400" />
                <p className="mt-1 text-xs font-semibold text-blue-800 dark:text-blue-200">{t("objects")}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">{t("crossSwapObjects")}</p>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 text-center dark:border-purple-800 dark:bg-purple-950/20">
                <Home className="mx-auto h-6 w-6 text-purple-600 dark:text-purple-400" />
                <p className="mt-1 text-xs font-semibold text-purple-800 dark:text-purple-200">{t("properties")}</p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400">{t("crossSwapProperties")}</p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50/50 p-3 text-center dark:border-green-800 dark:bg-green-950/20">
                <Briefcase className="mx-auto h-6 w-6 text-green-600 dark:text-green-400" />
                <p className="mt-1 text-xs font-semibold text-green-800 dark:text-green-200">{t("services")}</p>
                <p className="text-[10px] text-green-600 dark:text-green-400">{t("crossSwapServices")}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("crossSwapExample")}</p>
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

      {/* Login history */}
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
            <p className="text-xl font-bold">{tokenLedger.reduce((s, e) => s + e.amount, 0)}</p>
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

      {/* Achievements */}
      <SectionCard title={t("achievements")} description={t("achievementsDesc")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`rounded-xl border p-3 transition ${
                ach.unlockedAt
                  ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
                  : "border-zinc-200 bg-zinc-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-800/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{ach.title}</p>
                  <p className="text-[10px] text-zinc-500">{ach.description}</p>
                </div>
                {ach.unlockedAt ? (
                  <Trophy className="h-4 w-4 text-amber-500" />
                ) : (
                  <Lock className="h-4 w-4 text-zinc-400" />
                )}
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>{ach.current}/{ach.target}</span>
                  <span>{ach.progress}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                  <div
                    className={`h-full rounded-full transition-all ${ach.unlockedAt ? "bg-amber-400" : "bg-blue-400"}`}
                    style={{ width: `${ach.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Token Shop */}
      <SectionCard
        title={t("tokenShop")}
        description={t("tokenShopDesc")}
        action={<Pill color="blue">{t("balance")}: {tokenLedger.reduce((s, e) => s + e.amount, 0)}</Pill>}
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {shopItems.map((item) => {
            const balance = tokenLedger.reduce((s, e) => s + e.amount, 0);
            const canAfford = balance >= item.cost;
            return (
              <div key={item.id} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{item.title}</p>
                    <p className="text-[10px] text-zinc-500">{item.description}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{item.cost} tokens</span>
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => void purchaseShopItem(item.id)}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    <ShoppingCart className="h-3 w-3" />
                    {t("buy")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

        </>
      ) : null}

      {/* Account Status & GDPR - always visible at bottom of "cont" tab */}
      {activeTab === "cont" && (
        <>
          {/* Account Pause */}
          <SectionCard title={t("accountPause")} description={t("accountPauseDesc")}>
            {accountStatus === "active" ? (
              <button
                type="button"
                onClick={() => void pauseAccount()}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
              >
                <Pause className="h-4 w-4" />
                {t("pauseAccountButton")}
              </button>
            ) : (
              <div className="space-y-2">
                <Pill color="amber">{t("accountPaused")}</Pill>
                <button
                  type="button"
                  onClick={() => void resumeAccount()}
                  className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <Play className="h-4 w-4" />
                  {t("resumeAccountButton")}
                </button>
              </div>
            )}
          </SectionCard>

          {/* GDPR Data Export */}
          <SectionCard title={t("dataExport")} description={t("dataExportDesc")}>
            <button
              type="button"
              onClick={async () => {
                const json = await exportUserData();
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `swaply-data-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Download className="h-4 w-4" />
              {t("downloadMyData")}
            </button>
          </SectionCard>
        </>
      )}

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
