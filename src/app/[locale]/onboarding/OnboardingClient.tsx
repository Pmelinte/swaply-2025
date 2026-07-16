"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getCountries } from "@/lib/lazy-imports";
import { Plus, X } from "lucide-react";
import type { LanguageCode } from "@/lib/types";
import { languageNames, locales, type Locale } from "@/i18n/config";
import {
  buildCanonicalLanguagePayload,
  normalizeProfileLocale,
} from "@/lib/profile/profileContract";
import { getGlobalProfileContract } from "@/lib/profile/userProfilePersistence";
import { isProfileConflict } from "@/lib/profile/profileService";
import { uploadItemPhoto } from "@/lib/storage";

type SwapGeoRange = "local" | "regional" | "international" | "vacation";
type SwapContext = "permanent" | "vacation" | "temporary" | "urgent";
type OpenToType = "object" | "property" | "service" | "event";
type SwapIntent = "exploring" | "open" | "clear" | "serious";

interface StepData {
  display_name?: string;
  first_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  address_country?: string;
  address_city?: string;
  languages?: LanguageCode[];
  auto_translate_messages?: boolean;
  show_original_language?: boolean;
  swap_geo_range?: SwapGeoRange;
  swap_context?: SwapContext[];
  open_to_types?: OpenToType[];
  swap_intent?: SwapIntent;
  bio?: string;
  affinity_groups?: string[];
  interests?: string[];
  occupation?: string;
}

interface Country {
  isoCode: string;
  name: string;
  flag?: string;
}

export function OnboardingClient() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("onboarding");
  const tp = useTranslations("profile");
  const tc = useTranslations("common");
  const { user, loading, updateProfileFields } = useAppState();

  const navigatingRef = useRef(false);
  const routeLanguage = normalizeProfileLocale(locale) ?? "en";
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({
    languages: [routeLanguage as LanguageCode],
    auto_translate_messages: true,
    show_original_language: false,
    swap_context: [],
    open_to_types: [],
    affinity_groups: [],
    interests: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!loading.auth && !user && !navigatingRef.current) {
      navigatingRef.current = true;
      window.location.href = `/${locale}/login?returnTo=/onboarding`;
    }
  }, [user, loading.auth, locale]);

  useEffect(() => {
    if (!user) return;
    const contract = getGlobalProfileContract(user, locale);
    const ordered = [
      contract.languagePreferences.primary,
      contract.languagePreferences.secondary,
      contract.languagePreferences.tertiary,
    ].filter((entry): entry is Locale => Boolean(entry));

    setStepData((previous) => ({
      ...previous,
      display_name: previous.display_name ?? user.displayName,
      first_name: previous.first_name ?? user.firstName,
      avatar_url: previous.avatar_url ?? user.avatarUrl,
      address_country: previous.address_country ?? user.location?.country,
      address_city: previous.address_city ?? user.location?.city,
      languages: ordered as unknown as LanguageCode[],
      auto_translate_messages: contract.languagePreferences.autoTranslateMessages,
      show_original_language: contract.languagePreferences.showOriginalLanguage,
    }));
  }, [locale, user]);

  useEffect(() => {
    if (user && !navigatingRef.current) {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.onboarding_completed && !navigatingRef.current) {
            navigatingRef.current = true;
            router.push("/");
          }
        });
    }
  }, [user, router, locale]);

  useEffect(() => {
    getCountries().then((list) => {
      setCountries(list.map((country) => ({
        isoCode: country.isoCode,
        name: country.name,
      })));
    });
  }, []);

  if (loading.auth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 py-12 text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
        <p>{tc("loading")}</p>
      </div>
    );
  }

  if (!user) return null;

  const handleStepData = (key: keyof StepData, value: unknown) => {
    setStepData((previous) => ({ ...previous, [key]: value }));
  };

  const saveStep = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload: Record<string, unknown> = {};

      switch (currentStep) {
        case 1: {
          if (!stepData.display_name || stepData.display_name.length < 2) {
            setError(tp("displayNameRequired"));
            return;
          }
          if (!stepData.date_of_birth) {
            setError(tp("dateOfBirthRequired"));
            return;
          }
          const dob = new Date(stepData.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())
            ? age - 1
            : age;
          if (actualAge < 16) {
            setError(tp("ageMinimum"));
            return;
          }
          payload.display_name = stepData.display_name;
          payload.first_name = stepData.first_name || null;
          payload.avatar_url = stepData.avatar_url || null;
          payload.date_of_birth = stepData.date_of_birth;
          break;
        }

        case 2:
          if (!stepData.address_country) {
            setError(tp("countryRequired"));
            return;
          }
          payload.address_country = stepData.address_country;
          payload.address_city = stepData.address_city || null;
          payload.location = {
            city: stepData.address_city || null,
            country: stepData.address_country,
          };
          break;

        case 3: {
          const ordered = (stepData.languages ?? [])
            .map(normalizeProfileLocale)
            .filter((entry): entry is Locale => Boolean(entry));
          if (ordered.length === 0) {
            setError(tp("languageRequired"));
            return;
          }
          if (new Set(ordered).size !== ordered.length || ordered.length > 3) {
            setError("Choose up to three distinct languages in preference order.");
            return;
          }
          Object.assign(payload, buildCanonicalLanguagePayload({
            primary: ordered[0],
            secondary: ordered[1] ?? null,
            tertiary: ordered[2] ?? null,
            autoTranslateMessages: stepData.auto_translate_messages ?? true,
            showOriginalLanguage: stepData.show_original_language ?? false,
          }));
          break;
        }

        case 4:
          payload.swap_geo_range = stepData.swap_geo_range || "regional";
          payload.swap_context = stepData.swap_context || [];
          payload.open_to_types = stepData.open_to_types || [];
          payload.swap_intent = stepData.swap_intent || "open";
          break;

        case 5:
          payload.bio = stepData.bio || null;
          payload.affinity_groups = stepData.affinity_groups || [];
          payload.interests = stepData.interests || [];
          payload.occupation = stepData.occupation || null;
          break;
      }

      await updateProfileFields(payload);

      if (currentStep === 5) {
        await finializeOnboarding();
      } else {
        setCurrentStep((step) => step + 1);
      }
    } catch (caught) {
      if (isProfileConflict(caught)) {
        setError("Your profile changed in another session. Fresh data was reloaded; review this step and continue again.");
      } else {
        setError(caught instanceof Error ? caught.message : "An error occurred");
      }
    } finally {
      setSaving(false);
    }
  };

  const skipToEnd = async () => {
    try {
      setSaving(true);
      setError(null);
      await finializeOnboarding();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "An error occurred");
      setSaving(false);
    }
  };

  const finializeOnboarding = async () => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase client not available");

      const completion = await fetch("/api/onboarding/complete", {
        method: "POST",
      });
      if (!completion.ok) {
        throw new Error("Unable to complete onboarding");
      }

      await supabase.rpc("update_profile_completeness", { p_user_id: user.id });

      if (!navigatingRef.current) {
        navigatingRef.current = true;
        router.push("/objects/new");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "An error occurred");
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((step) => step - 1);
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setAvatarUploading(true);
      const result = await uploadItemPhoto(file, user.id);
      if (result.error) setError(result.error);
      else if (result.url) handleStepData("avatar_url", result.url);
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">{currentStep}/5</span>
            <span className="text-xs text-zinc-400">{[
              t("wizardStep1Title"), t("wizardStep2Title"), t("wizardStep3Title"), t("wizardStep4Title"), t("step5Title"),
            ][currentStep - 1]}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-1 rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {currentStep === 1 && <Step1 data={stepData} onChange={handleStepData} onUpload={handleAvatarUpload} uploading={avatarUploading} />}
          {currentStep === 2 && <Step2 data={stepData} onChange={handleStepData} countries={countries} />}
          {currentStep === 3 && <Step3 data={stepData} onChange={handleStepData} />}
          {currentStep === 4 && <Step4 data={stepData} onChange={handleStepData} />}
          {currentStep === 5 && <Step5 data={stepData} onChange={handleStepData} />}

          <div className="mt-8 flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={saving}
                className="flex-1 rounded-full border border-zinc-300 px-8 py-3 font-semibold text-zinc-700 hover:border-zinc-400 disabled:opacity-50"
              >
                {tc("back")}
              </button>
            )}

            {currentStep <= 3 ? (
              <button
                onClick={saveStep}
                disabled={saving}
                className="flex-1 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? tc("saving") : tc("next")}
              </button>
            ) : (
              <>
                <button onClick={skipToEnd} disabled={saving} className="py-3 text-sm text-zinc-400 hover:text-zinc-600">
                  {t("completeLater")}
                </button>
                <button
                  onClick={saveStep}
                  disabled={saving}
                  className="flex-1 rounded-full bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? tc("saving") : tc("next")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1({ data, onChange, onUpload, uploading }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const t = useTranslations("onboarding");
  const tp = useTranslations("profile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("wizardStep1Title")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("step1Subtitle")}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 bg-zinc-100">
          {data.avatar_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-zinc-400">
              {data.display_name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
            <Plus className="h-3.5 w-3.5" />
            {tp("uploadAvatar")}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (file) await onUpload(file);
              }}
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-500">
            {tp("avatarUrl")}
            <input
              type="url"
              value={data.avatar_url ?? ""}
              onChange={(event) => onChange("avatar_url", event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      <label className="block text-sm font-semibold text-zinc-700">
        {tp("displayName")} *
        <input
          type="text"
          minLength={2}
          value={data.display_name ?? ""}
          onChange={(event) => onChange("display_name", event.target.value)}
          placeholder="John Doe"
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block text-sm font-semibold text-zinc-700">
        {tp("firstName")}
        <input
          type="text"
          value={data.first_name ?? ""}
          onChange={(event) => onChange("first_name", event.target.value)}
          placeholder="John"
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>

      <label className="block text-sm font-semibold text-zinc-700">
        {t("dateOfBirthLabel")}
        <input
          type="date"
          value={data.date_of_birth ?? ""}
          onChange={(event) => onChange("date_of_birth", event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

function Step2({ data, onChange, countries }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
  countries: Country[];
}) {
  const t = useTranslations("onboarding");
  const tl = useTranslations("location");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("wizardStep2Title")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("step2Subtitle")}</p>
      </div>

      <label className="block text-sm font-semibold text-zinc-700">
        {t("countryLabel")} *
        <select
          value={data.address_country ?? ""}
          onChange={(event) => onChange("address_country", event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{tl("selectCountry")}</option>
          {countries.map((country) => (
            <option key={country.isoCode} value={country.isoCode}>{country.name}</option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-semibold text-zinc-700">
        {t("cityLabel")}
        <input
          type="text"
          value={data.address_city ?? ""}
          onChange={(event) => onChange("address_city", event.target.value)}
          placeholder={t("cityPlaceholder")}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

function Step3({ data, onChange }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
}) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const ordered = (data.languages ?? []) as unknown as Locale[];
  const text = locale === "ro"
    ? {
        primary: "Limba principală",
        secondary: "Limba secundară",
        tertiary: "A treia limbă",
        optional: "Opțional",
        autoTranslate: "Tradu automat mesajele",
        showOriginal: "Arată și textul original",
      }
    : {
        primary: "Primary language",
        secondary: "Secondary language",
        tertiary: "Third language",
        optional: "Optional",
        autoTranslate: "Translate messages automatically",
        showOriginal: "Also show the original text",
      };

  const setLanguage = (position: 0 | 1 | 2, value: string) => {
    const next: Array<Locale | null> = [ordered[0] ?? null, ordered[1] ?? null, ordered[2] ?? null];
    next[position] = value ? value as Locale : null;
    if (position === 0 && !next[0]) return;
    const compact = next.filter((entry): entry is Locale => Boolean(entry));
    if (new Set(compact).size !== compact.length) return;
    onChange("languages", compact as unknown as LanguageCode[]);
  };

  const selectLanguage = (
    position: 0 | 1 | 2,
    label: string,
    value: Locale | undefined,
    optional: boolean,
  ) => {
    const selectedElsewhere = new Set(ordered.filter((entry, index) => entry && index !== position));
    return (
      <label className="block text-sm font-semibold text-zinc-700">
        {label}
        <select
          value={value ?? ""}
          onChange={(event) => setLanguage(position, event.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          {optional && <option value="">{text.optional}</option>}
          {locales
            .filter((candidate) => candidate === value || !selectedElsewhere.has(candidate))
            .map((candidate) => (
              <option key={candidate} value={candidate}>
                {languageNames[candidate].nativeName} ({languageNames[candidate].name})
              </option>
            ))}
        </select>
      </label>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("wizardStep3Title")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("step3Subtitle")}</p>
      </div>

      <div className="grid gap-3">
        {selectLanguage(0, text.primary, ordered[0], false)}
        {selectLanguage(1, text.secondary, ordered[1], true)}
        {selectLanguage(2, text.tertiary, ordered[2], true)}
      </div>

      <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={data.auto_translate_messages ?? true}
            onChange={(event) => onChange("auto_translate_messages", event.target.checked)}
            className="mt-0.5"
          />
          <span>{text.autoTranslate}</span>
        </label>
        <label className="flex items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={data.show_original_language ?? false}
            onChange={(event) => onChange("show_original_language", event.target.checked)}
            className="mt-0.5"
          />
          <span>{text.showOriginal}</span>
        </label>
      </div>
    </div>
  );
}

function Step4({ data, onChange }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
}) {
  const t = useTranslations("onboarding");

  const geoOptions: { value: SwapGeoRange; labelKey: string }[] = [
    { value: "local", labelKey: "geoLocal" },
    { value: "regional", labelKey: "geoRegional" },
    { value: "international", labelKey: "geoInternational" },
    { value: "vacation", labelKey: "geoVacation" },
  ];

  const contextOptions: { value: SwapContext; labelKey: string }[] = [
    { value: "permanent", labelKey: "contextPermanent" },
    { value: "vacation", labelKey: "contextVacation" },
    { value: "temporary", labelKey: "contextTemporary" },
    { value: "urgent", labelKey: "contextUrgent" },
  ];

  const typeOptions: { value: OpenToType; labelKey: string }[] = [
    { value: "object", labelKey: "typeObject" },
    { value: "property", labelKey: "typeProperty" },
    { value: "service", labelKey: "typeService" },
    { value: "event", labelKey: "typeEvent" },
  ];

  const intentOptions: { value: SwapIntent; labelKey: string; descKey: string }[] = [
    { value: "exploring", labelKey: "intentExploring", descKey: "intentExploringDesc" },
    { value: "open", labelKey: "intentOpen", descKey: "intentOpenDesc" },
    { value: "clear", labelKey: "intentClear", descKey: "intentClearDesc" },
    { value: "serious", labelKey: "intentSerious", descKey: "intentSeriousDesc" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("wizardStep4Title")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("step4Subtitle")}</p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-zinc-700">{t("geoRangeLabel")}</label>
        <div className="space-y-2">
          {geoOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange("swap_geo_range", option.value)}
              className={`w-full rounded-lg px-4 py-3 text-left font-semibold transition ${
                data.swap_geo_range === option.value ? "bg-blue-600 text-white" : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
              }`}
            >
              {t(option.labelKey as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-zinc-700">{t("swapContextLabel")}</label>
        <div className="flex flex-wrap gap-2">
          {contextOptions.map((option) => {
            const isSelected = (data.swap_context || []).includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => {
                  const contexts = data.swap_context || [];
                  onChange("swap_context", isSelected ? contexts.filter((context) => context !== option.value) : [...contexts, option.value]);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isSelected ? "bg-blue-600 text-white" : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
                }`}
              >
                {t(option.labelKey as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-zinc-700">{t("openToLabel")}</label>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => {
            const isSelected = (data.open_to_types || []).includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => {
                  const types = data.open_to_types || [];
                  onChange("open_to_types", isSelected ? types.filter((type) => type !== option.value) : [...types, option.value]);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isSelected ? "bg-blue-600 text-white" : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
                }`}
              >
                {t(option.labelKey as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-zinc-700">{t("intentLabel")}</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {intentOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onChange("swap_intent", option.value)}
              className={`rounded-lg p-3 text-left transition ${
                data.swap_intent === option.value ? "bg-blue-600 text-white" : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
              }`}
            >
              <div className="text-sm font-semibold">{t(option.labelKey as Parameters<typeof t>[0])}</div>
              <div className={`mt-1 text-xs ${data.swap_intent === option.value ? "text-blue-100" : "text-zinc-500"}`}>
                {t(option.descKey as Parameters<typeof t>[0])}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, onChange }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
}) {
  const t = useTranslations("onboarding");
  const tp = useTranslations("profile");
  const [interestInput, setInterestInput] = useState("");
  const [affinityInput, setAffinityInput] = useState("");

  const addTag = (type: "interests" | "affinity_groups", value: string) => {
    if (!value.trim()) return;
    const current = (data[type] || []) as string[];
    if (current.length >= 10) return;
    if (!current.includes(value.trim())) onChange(type, [...current, value.trim()]);
    if (type === "interests") setInterestInput("");
    else setAffinityInput("");
  };

  const removeTag = (type: "interests" | "affinity_groups", index: number) => {
    const current = (data[type] || []) as string[];
    onChange(type, current.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{t("step5Title")}</h2>
        <p className="mt-1 text-sm text-zinc-600">{t("step5Subtitle")}</p>
      </div>

      <label className="block text-sm font-semibold text-zinc-700">
        {tp("bio")}
        <textarea
          value={data.bio ?? ""}
          onChange={(event) => onChange("bio", event.target.value.slice(0, 500))}
          placeholder={t("bioPlaceholder")}
          maxLength={500}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <p className="mt-1 text-xs text-zinc-400">{(data.bio || "").length}/500</p>
      </label>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">{t("affinityLabel")}</label>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={affinityInput}
            onChange={(event) => setAffinityInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag("affinity_groups", affinityInput);
              }
            }}
            placeholder={t("affinityPlaceholder")}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => addTag("affinity_groups", affinityInput)} className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.affinity_groups || []).map((tag, index) => (
            <span key={`${tag}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
              {tag}
              <button type="button" onClick={() => removeTag("affinity_groups", index)} className="text-blue-600 hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-zinc-700">{t("interestsLabel")}</label>
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={interestInput}
            onChange={(event) => setInterestInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag("interests", interestInput);
              }
            }}
            placeholder={t("interestsPlaceholder")}
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => addTag("interests", interestInput)} className="rounded-lg bg-blue-50 px-3 py-2 text-blue-700 hover:bg-blue-100">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.interests || []).map((tag, index) => (
            <span key={`${tag}-${index}`} className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800">
              {tag}
              <button type="button" onClick={() => removeTag("interests", index)} className="text-blue-600 hover:text-blue-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <label className="block text-sm font-semibold text-zinc-700">
        {t("occupationLabel")}
        <input
          type="text"
          value={data.occupation ?? ""}
          onChange={(event) => onChange("occupation", event.target.value)}
          placeholder={t("occupationPlaceholder")}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}
