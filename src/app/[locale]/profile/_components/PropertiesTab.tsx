"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Home, Trash2, Package, Briefcase, Plus,
  Palette, Code, GraduationCap, Hammer,
} from "lucide-react";
import { Pill, SectionCard } from "@/components/ui-custom";
import type {
  UserProfile, HouseProfile, ServiceProfile,
  HouseAmenity, HouseRule, PropertyType, HouseSwapMode,
  ServiceCategory, SkillLevel, ServiceDelivery,
} from "@/lib/types";

interface PropertiesTabProps {
  user: UserProfile;
  updateHouseProfile: (profile: HouseProfile) => Promise<void>;
  addServiceProfile: (profile: ServiceProfile) => Promise<void>;
  removeServiceProfile: (skillName: string) => Promise<void>;
}

const DEFAULT_HOUSE: HouseProfile = {
  propertyType: "apartment", bedrooms: 1, bathrooms: 1, maxGuests: 2,
  amenities: [], rules: [], description: "", neighborhood: "",
  nearbyAttractions: "", transport: "", photos: [],
  availableDates: [], minStayDays: 1, maxStayDays: 30,
  swapMode: "simultaneous", verified: false, insuranceReminder: false,
};

const DEFAULT_SERVICE: ServiceProfile = {
  category: "creative", skillName: "", skillLevel: "intermediate",
  description: "", portfolio: [], hoursPerWeek: 5,
  delivery: "remote", hourlyEquivalent: 0,
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  creative: <Palette className="h-4 w-4" />,
  technical: <Code className="h-4 w-4" />,
  education: <GraduationCap className="h-4 w-4" />,
  physical: <Hammer className="h-4 w-4" />,
  professional: <Briefcase className="h-4 w-4" />,
};

export default function PropertiesTab({ user, updateHouseProfile, addServiceProfile, removeServiceProfile }: PropertiesTabProps) {
  const t = useTranslations("profile");
  const [houseDraft, setHouseDraft] = useState<HouseProfile>(user.houseProfile ?? DEFAULT_HOUSE);
  const [houseSaveMsg, setHouseSaveMsg] = useState<string | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceProfile>(DEFAULT_SERVICE);
  const [serviceSaveMsg, setServiceSaveMsg] = useState<string | null>(null);

  return (
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
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("houseAmenities")}>
            {(["wifi", "parking", "ac", "heating", "washer", "kitchen", "pool", "garden", "pet_friendly", "tv", "workspace"] as HouseAmenity[]).map((a) => {
              const active = houseDraft.amenities.includes(a);
              return (
                <button key={a} type="button"
                  onClick={() => setHouseDraft({
                    ...houseDraft,
                    amenities: active ? houseDraft.amenities.filter((x) => x !== a) : [...houseDraft.amenities, a],
                  })}
                  aria-pressed={active}
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
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={t("houseRulesTitle")}>
            {(["no_smoking", "no_pets", "no_parties", "no_shoes", "quiet_hours", "max_guests"] as HouseRule[]).map((r) => {
              const active = houseDraft.rules.includes(r);
              return (
                <button key={r} type="button"
                  onClick={() => setHouseDraft({
                    ...houseDraft,
                    rules: active ? houseDraft.rules.filter((x) => x !== r) : [...houseDraft.rules, r],
                  })}
                  aria-pressed={active}
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
            {user.serviceProfiles!.map((sp) => (
              <div key={sp.skillName} className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-800">
                <span className="text-blue-600 dark:text-blue-400">{CAT_ICONS[sp.category]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{sp.skillName}</p>
                  <p className="text-[10px] text-zinc-500">{t(`svcCat_${sp.category}`)} &middot; {t(`svcLevel${sp.skillLevel.charAt(0).toUpperCase() + sp.skillLevel.slice(1)}`)} &middot; {t(`svcDelivery${sp.delivery.charAt(0).toUpperCase() + sp.delivery.slice(1).replace(/_./g, (m) => m[1].toUpperCase())}`)} &middot; {sp.hoursPerWeek}h/{t("week")}</p>
                </div>
                <button type="button"
                  onClick={() => void removeServiceProfile(sp.skillName)}
                  className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  aria-label={`${t("removeService")} ${sp.skillName}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
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
                setServiceDraft(DEFAULT_SERVICE);
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
  );
}
