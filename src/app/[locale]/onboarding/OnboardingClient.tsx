"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { useAppState } from "@/lib/state";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getCountries } from "@/lib/lazy-imports";
import { Plus, X } from "lucide-react";
import type { LanguageCode } from "@/lib/types";
import { languageNames, type Locale } from "@/i18n/config";
import { uploadItemPhoto } from "@/lib/storage";

type SwapGeoRange = "local" | "regional" | "international" | "vacation";
type SwapContext = "permanent" | "vacation" | "temporary" | "urgent";
type OpenToType = "object" | "property" | "service" | "event";
type SwapIntent = "exploring" | "open" | "clear" | "serious";

interface StepData {
  // Step 1
  display_name?: string;
  first_name?: string;
  avatar_url?: string;
  date_of_birth?: string;

  // Step 2
  address_country?: string;
  address_city?: string;

  // Step 3
  languages?: LanguageCode[];

  // Step 4
  swap_geo_range?: SwapGeoRange;
  swap_context?: SwapContext[];
  open_to_types?: OpenToType[];
  swap_intent?: SwapIntent;

  // Step 5
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
  const { user, loading } = useAppState();

  const navigatingRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({
    languages: [locale as LanguageCode],
    swap_context: [],
    open_to_types: [],
    affinity_groups: [],
    interests: [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Redirect if not authenticated or onboarding already completed
  useEffect(() => {
    if (!loading.auth && !user && !navigatingRef.current) {
      navigatingRef.current = true;
      window.location.href = `/${locale}/login?returnTo=/onboarding`;
    }
  }, [user, loading.auth, locale]);

  // Check if onboarding already completed
  useEffect(() => {
    if (user && !navigatingRef.current) {
      const supabase = getSupabaseClient();
      supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.onboarding_completed && !navigatingRef.current) {
            navigatingRef.current = true;
            router.push(`/${locale}`);
          }
        });
    }
  }, [user, router, locale]);

  // Load countries
  useEffect(() => {
    getCountries().then((list: Record<string, string | number>[]) => {
      setCountries(list.map((c) => ({
        isoCode: String(c.isoCode),
        name: String(c.name),
      })));
    });
  }, []);

  if (loading.auth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 py-12 text-zinc-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-500" />
        <p>{tc("loading")}</p>
      </div>
    );
  }

  if (!user) return null;

  const handleStepData = (key: keyof StepData, value: unknown) => {
    setStepData((prev) => ({ ...prev, [key]: value }));
  };

  const saveStep = async () => {
    try {
      setSaving(true);
      setError(null);

      const supabase = getSupabaseClient();
      const payload: Record<string, unknown> = {
        user_id: user.id,
      };

      // Prepare payload based on current step
      switch (currentStep) {
        case 1:
          if (!stepData.display_name || stepData.display_name.length < 2) {
            setError(tp("displayNameRequired"));
            return;
          }
          if (!stepData.date_of_birth) {
            setError(tp("dateOfBirthRequired"));
            return;
          }
          payload.display_name = stepData.display_name;
          payload.first_name = stepData.first_name || null;
          payload.avatar_url = stepData.avatar_url || null;
          payload.date_of_birth = stepData.date_of_birth;
          break;

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

        case 3:
          if (!stepData.languages || stepData.languages.length === 0) {
            setError(tp("languageRequired"));
            return;
          }
          payload.languages = stepData.languages;
          break;

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

      const { error: updateError } = await supabase
        .from("profiles")
        .update(payload)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // If completed all steps, finalize onboarding
      if (currentStep === 5) {
        await finializeOnboarding();
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const skipToEnd = async () => {
    try {
      setSaving(true);
      setError(null);
      await finializeOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  const finializeOnboarding = async () => {
    try {
      const supabase = getSupabaseClient();

      // Mark onboarding as completed
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          onboarding_step: "done",
        })
        .eq("user_id", user.id);

      // Update profile completeness via RPC
      await supabase.rpc("update_profile_completeness", {
        p_user_id: user.id,
      });

      // Update onboarding progress
      await supabase
        .from("onboarding_progress")
        .update({
          step_profile: true,
          current_step: "first_item",
        })
        .eq("user_id", user.id);

      // Redirect to objects/new
      if (!navigatingRef.current) {
        navigatingRef.current = true;
        router.push(`/${locale}/objects/new`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      setAvatarUploading(true);
      const result = await uploadItemPhoto(file, user.id);
      if (result.error) {
        setError(result.error);
      } else if (result.url) {
        handleStepData("avatar_url", result.url);
      }
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-zinc-50 to-blue-50 min-h-screen py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-zinc-700">
              {currentStep}/5
            </span>
            <span className="text-xs text-zinc-400">{getStepTitle(currentStep)}</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-1 overflow-hidden">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && <Step1 data={stepData} onChange={handleStepData} onUpload={handleAvatarUpload} uploading={avatarUploading} />}
          {currentStep === 2 && <Step2 data={stepData} onChange={handleStepData} countries={countries} />}
          {currentStep === 3 && <Step3 data={stepData} onChange={handleStepData} />}
          {currentStep === 4 && <Step4 data={stepData} onChange={handleStepData} />}
          {currentStep === 5 && <Step5 data={stepData} onChange={handleStepData} />}

          {/* Buttons */}
          <div className="mt-8 flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={saving}
                className="flex-1 border border-zinc-300 text-zinc-700 rounded-full px-8 py-3 font-semibold hover:border-zinc-400 disabled:opacity-50"
              >
                {tc("back")}
              </button>
            )}

            {currentStep <= 3 ? (
              <button
                onClick={saveStep}
                disabled={saving}
                className="flex-1 bg-blue-600 text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? tc("saving") : tc("next")}
              </button>
            ) : (
              <>
                <button
                  onClick={skipToEnd}
                  disabled={saving}
                  className="text-zinc-400 text-sm hover:text-zinc-600 py-3"
                >
                  {t("completeLater")}
                </button>
                <button
                  onClick={saveStep}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-full px-8 py-3 font-semibold hover:bg-blue-700 disabled:opacity-50"
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

// Step 1: Who are you
function Step1({ data, onChange, onUpload, uploading }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
}) {
  const tp = useTranslations("profile");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">{tp("publicIdentity")}</h2>
        <p className="text-sm text-zinc-600 mt-1">Tell us who you are</p>
      </div>

      {/* Avatar */}
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
        <div className="space-y-2 flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">
            <Plus className="h-3.5 w-3.5" />
            {tp("uploadAvatar")}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  await onUpload(file);
                }
              }}
            />
          </label>
          <label className="block text-xs font-semibold text-zinc-500">
            {tp("avatarUrl")}
            <input
              type="url"
              value={data.avatar_url ?? ""}
              onChange={(e) => onChange("avatar_url", e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Display Name */}
      <label className="block text-sm font-semibold text-zinc-700">
        {tp("displayName")} *
        <input
          type="text"
          minLength={2}
          value={data.display_name ?? ""}
          onChange={(e) => onChange("display_name", e.target.value)}
          placeholder="John Doe"
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* First Name */}
      <label className="block text-sm font-semibold text-zinc-700">
        {tp("firstName")}
        <input
          type="text"
          value={data.first_name ?? ""}
          onChange={(e) => onChange("first_name", e.target.value)}
          placeholder="John"
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* Date of Birth */}
      <label className="block text-sm font-semibold text-zinc-700">
        Date of Birth * (for verification, not public)
        <input
          type="date"
          value={data.date_of_birth ?? ""}
          onChange={(e) => onChange("date_of_birth", e.target.value)}
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

// Step 2: Where are you
function Step2({ data, onChange, countries }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
  countries: Country[];
}) {

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Where are you?</h2>
        <p className="text-sm text-zinc-600 mt-1">Help us find better matches nearby</p>
      </div>

      {/* Country */}
      <label className="block text-sm font-semibold text-zinc-700">
        Country *
        <select
          value={data.address_country ?? ""}
          onChange={(e) => onChange("address_country", e.target.value)}
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a country</option>
          {countries.map((c) => (
            <option key={c.isoCode} value={c.isoCode}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* City */}
      <label className="block text-sm font-semibold text-zinc-700">
        City
        <input
          type="text"
          value={data.address_city ?? ""}
          onChange={(e) => onChange("address_city", e.target.value)}
          placeholder="e.g. Bucharest"
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

// Step 3: Your languages
function Step3({ data, onChange }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
}) {
  const allLanguages: LanguageCode[] = [
    "ro", "en", "fr", "de", "es", "it", "pt", "nl", "pl", "el",
    "hu", "bg", "cs", "sk", "hr", "sl", "sr", "sv", "da", "fi",
    "no", "lt", "lv", "et", "ru", "tr", "ar", "zh", "hi", "ja", "ko",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Your languages</h2>
        <p className="text-sm text-zinc-600 mt-1">Select all languages you speak</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {allLanguages.map((lang) => {
          const isSelected = (data.languages || []).includes(lang);
          const info = languageNames[lang as Locale];

          return (
            <button
              key={lang}
              onClick={() => {
                const langs = data.languages || [];
                if (isSelected) {
                  onChange("languages", langs.filter((l) => l !== lang));
                } else {
                  onChange("languages", [...langs, lang]);
                }
              }}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
              }`}
            >
              {info ? info.nativeName : lang.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Step 4: How you want to swap
function Step4({ data, onChange }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">How do you want to swap?</h2>
        <p className="text-sm text-zinc-600 mt-1">Tell us your preferences (optional)</p>
      </div>

      {/* Swap Geo Range */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-3">Geographic range</label>
        <div className="space-y-2">
          {[
            { value: "local" as SwapGeoRange, label: "🏙️ Local" },
            { value: "regional" as SwapGeoRange, label: "🗺️ Regional" },
            { value: "international" as SwapGeoRange, label: "🌍 International" },
            { value: "vacation" as SwapGeoRange, label: "✈️ Vacation" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange("swap_geo_range", opt.value)}
              className={`w-full px-4 py-3 rounded-lg font-semibold text-left transition ${
                data.swap_geo_range === opt.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Swap Context */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-3">Swap context</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "permanent" as SwapContext, label: "🏠 Permanent" },
            { value: "vacation" as SwapContext, label: "✈️ Vacation" },
            { value: "temporary" as SwapContext, label: "⏱️ Temporary" },
            { value: "urgent" as SwapContext, label: "🚨 Urgent" },
          ].map((opt) => {
            const isSelected = (data.swap_context || []).includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  const contexts = data.swap_context || [];
                  if (isSelected) {
                    onChange("swap_context", contexts.filter((c) => c !== opt.value));
                  } else {
                    onChange("swap_context", [...contexts, opt.value]);
                  }
                }}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Open to Types */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-3">Types you&apos;re open to</label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "object" as OpenToType, label: "📦 Objects" },
            { value: "property" as OpenToType, label: "🏠 Properties" },
            { value: "service" as OpenToType, label: "🛠️ Services" },
            { value: "event" as OpenToType, label: "🎫 Events" },
          ].map((opt) => {
            const isSelected = (data.open_to_types || []).includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  const types = data.open_to_types || [];
                  if (isSelected) {
                    onChange("open_to_types", types.filter((t) => t !== opt.value));
                  } else {
                    onChange("open_to_types", [...types, opt.value]);
                  }
                }}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swap Intent */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-3">Your intent</label>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { value: "exploring" as SwapIntent, label: "🔭 Exploring", desc: "I want to see what exists" },
            { value: "open" as SwapIntent, label: "🤝 Open", desc: "I'd swap if something good comes up" },
            { value: "clear" as SwapIntent, label: "🎯 Clear", desc: "I have a specific item in mind" },
            { value: "serious" as SwapIntent, label: "🔥 Serious", desc: "Ready to swap now" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange("swap_intent", opt.value)}
              className={`p-3 rounded-lg text-left transition ${
                data.swap_intent === opt.value
                  ? "bg-blue-600 text-white"
                  : "border border-zinc-200 text-zinc-700 hover:border-blue-300"
              }`}
            >
              <div className="font-semibold text-sm">{opt.label}</div>
              <div className={`text-xs mt-1 ${data.swap_intent === opt.value ? "text-blue-100" : "text-zinc-500"}`}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 5: Interests & Affinity
function Step5({ data, onChange }: {
  data: StepData;
  onChange: (key: keyof StepData, value: unknown) => void;
}) {
  const tp = useTranslations("profile");
  const [interestInput, setInterestInput] = useState("");
  const [affinityInput, setAffinityInput] = useState("");

  const addTag = (type: "interests" | "affinity_groups", value: string) => {
    if (!value.trim()) return;
    const current = (data[type] || []) as string[];
    if (current.length >= 10) return;
    if (!current.includes(value.trim())) {
      onChange(type, [...current, value.trim()]);
    }
    if (type === "interests") setInterestInput("");
    else setAffinityInput("");
  };

  const removeTag = (type: "interests" | "affinity_groups", index: number) => {
    const current = (data[type] || []) as string[];
    onChange(type, current.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900">Interests & Affinities</h2>
        <p className="text-sm text-zinc-600 mt-1">Tell us about yourself (optional)</p>
      </div>

      {/* Bio */}
      <label className="block text-sm font-semibold text-zinc-700">
        {tp("bio")}
        <textarea
          value={data.bio ?? ""}
          onChange={(e) => onChange("bio", e.target.value.slice(0, 500))}
          placeholder="Tell us about yourself..."
          maxLength={500}
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
        <p className="text-xs text-zinc-400 mt-1">
          {(data.bio || "").length}/500
        </p>
      </label>

      {/* Affinity Groups */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          Affinity groups (hobbies, communities)
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={affinityInput}
            onChange={(e) => setAffinityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag("affinity_groups", affinityInput);
              }
            }}
            placeholder="e.g. vinyl, photography, cycling"
            className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => addTag("affinity_groups", affinityInput)}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.affinity_groups || []).map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag("affinity_groups", i)}
                className="text-blue-600 hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="block text-sm font-semibold text-zinc-700 mb-2">
          Interests (topics you care about)
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag("interests", interestInput);
              }
            }}
            placeholder="e.g. music, cooking, travel"
            className="flex-1 border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => addTag("interests", interestInput)}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(data.interests || []).map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag("interests", i)}
                className="text-blue-600 hover:text-blue-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Occupation */}
      <label className="block text-sm font-semibold text-zinc-700">
        Occupation
        <input
          type="text"
          value={data.occupation ?? ""}
          onChange={(e) => onChange("occupation", e.target.value)}
          placeholder="e.g. Software Engineer"
          className="mt-1 w-full border border-zinc-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
        />
      </label>
    </div>
  );
}

function getStepTitle(step: number): string {
  const titles: Record<number, string> = {
    1: "Who are you?",
    2: "Where are you?",
    3: "Your languages",
    4: "Your preferences",
    5: "Interests & bio",
  };
  return titles[step] || "";
}
